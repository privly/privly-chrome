/**
 * @fileOverview 
 *
 * This file manages the message interface with the compiled
 * cryptography library from the browser's JavaScript. It's counterpart in the
 * JavaScript world is library_interface.js. All messages sent to or from the
 * compiled library pass through this code.
 *
 * Several test functions are included for the purposes of checking integration
 * with Google's Native Client architecture. The test functions make use of 
 * libTomCrypt, which is a stable but less widely used cryptography library.
 * libTomCrypt is far simpler to develop against than Mozilla's NSS, OpenSSL, 
 * and (to an extent) libSodium. We recommend you use libTomCrypt when 
 * implementing new Injectable Applications, then we will work to properly
 * integrate it with the compiled code. API functions will be added to the 
 * library as injectable applications are added to the extension. Injectable
 * apps should not specify which library processes their cryptographic calls.
 *
 * For more information, read README.md.
 *
 * From Google's Documentation on the Native Client Architecture:
 *
 * To load the NaCl module, the browser first looks for the
 * CreateModule() factory method (at the end of this file).  It calls
 * CreateModule() once to load the module code from your .nexe.  After the
 * .nexe code is loaded, CreateModule() is not called again.
 *
 * Once the .nexe code is loaded, the browser than calls the CreateInstance()
 * method on the object returned by CreateModule().  It calls CreateInstance()
 * each time it encounters an <embed> tag that references your NaCl module.
 *
 * The browser can talk to your NaCl module via the postMessage() Javascript
 * function.  When you call postMessage() on your NaCl module from the browser,
 * this becomes a call to the HandleMessage() method of your pp::Instance
 * subclass.  You can send messages back to the browser by calling the
 * PostMessage() method on your pp::Instance.  Note that these two methods
 * (postMessage() in Javascript and PostMessage() in C++) are asynchronous.
 * This means they return immediately - there is no waiting for the message
 * to be handled.  This has implications in your program design, particularly
 * when mutating property values that are exposed to both the browser and the
 * NaCl module.
 **/

#include <cstdio>
#include <string>
#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/var.h"

#include "tomcrypt.h"
#include "json/json.h"

/**
 * These string identifiers are used for selecting functions to process the
 * messaged JSON objects. They must all return a JSON object that is serialized
 * to a string and returned to JavaScript.
 **/
namespace {
  
  // String identifier for the helloWorld function
  const char* const kHelloWorld = "helloWorld";
  
  // String identifier for the LibTomCryptHelloWorldDecrypt function
  const char* const kLibTomCryptHelloWorldDecrypt = 
    "libTomCryptHelloWorldDecrypt";
  
  // String identifier for the LibTomCryptHelloWorldEncrypt function
  const char* const kLibTomCryptHelloWorldEncrypt = 
    "libTomCryptHelloWorldEncrypt";
  
}

/**
 * The Instance class.  One of these exists for each instance of your NaCl
 * module on the web page.
 *
 * From Google's Documentation on the Native Client Architecture:
 * The browser will ask the Module object to create
 * a new Instance for each occurence of the <embed> tag that has these
 * attributes:
 *     type="application/x-nacl"
 *     src="hello_tutorial.nmf"
 * To communicate with the browser, you must override HandleMessage() for
 * receiving messages from the browser, and use PostMessage() to send messages
 * back to the browser.  Note that this interface is asynchronous.
 */
class CryptographyLibraryInstance : public pp::Instance {
  
 public:
   
  /**
   * The constructor creates the plugin-side instance.
   * @param {PP_Instance} instance instance the handle to the browser-side
   * plugin instance.
   */
  explicit CryptographyLibraryInstance(PP_Instance instance) : 
  pp::Instance(instance) {}
  virtual ~CryptographyLibraryInstance() {}
  
  /**
   * Parses the message sent by JavaScript into a JSON object.
   *
   * @param {const pp::Var&} var_message A JSON object serialized
   * as a string.
   * @return {Json::Value} Returns the JSON representation of the message.
   */
  virtual Json::Value parseJson(const pp::Var& var_message) {
    std::string message = var_message.AsString();
    Json::Value root;
    Json::Reader reader;
    bool parsingSuccessful = reader.parse( message, root );
    if ( !parsingSuccessful )
    {
      return root; // Failed to parse JSON. todo: add status message
    } else {
      return root;
    }
  }
  
  /**
   * Encrypt a string for the purpose of testing the libTomCrypt library.
   *
   * @param {Json::Value} json The JSON object as parsed by parseJson.
   * @return {Json::Value} The same JSON object as sent to the library,
   * with the ciphertext added.
   */
  virtual Json::Value libTomCryptHelloWorldEncrypt(Json::Value json) {
    
    unsigned char pt[64], ct[64], key[64], encoded[256];
    symmetric_key skey; 
    int err;
    long unsigned int encodedLength[1] = {256};
    
    // Key is loaded appropriately in key
    strcpy((char*)key, "key");
    
    // Load a block of plaintext in pt
    strcpy((char*)pt, (char*)json["cleartext"].asString().c_str());
    
    // Schedule the key
    err = blowfish_setup(key,
          8,
          0,
          &skey);
    
    blowfish_ecb_encrypt(pt, // encrypt this array
                         ct, // store encrypted data here
                         &skey); // our previously scheduled key
    
    // Terminate the cipher context
    blowfish_done(&skey);
    
    err = base64_encode(ct, 64, encoded, encodedLength);
    
    std::string str((char *)encoded);
    json["ciphertext"] = str;
    
    return json;
    
  }
  
  /**
   * Decrypt a string for the purpose of testing the libTomCrypt library.
   *
   * @param {Json::Value} json The JSON object as parsed by parseJson.
   * @return {Json::Value} The same JSON object as sent to the library,
   * with the ciphertext added.
   */
  virtual Json::Value libTomCryptHelloWorldDecrypt(Json::Value json) {
    
    unsigned char pt[64], ct[64], key[64], encoded[256];
    symmetric_key skey; 
    int err;
    long unsigned int decodedLength[1] = {256};
    
    strcpy((char*)encoded, json["ciphertext"].asString().c_str());
    
    err = base64_decode(encoded, 256, ct, decodedLength);
    
    // Key is loaded appropriately in key
    strcpy((char*)key, "key");
    
    // Schedule the key
    err = blowfish_setup(key,
          8,
          0,
          &skey);
          
          
    // Now ct holds the encrypted version of pt
    blowfish_ecb_decrypt(ct, // decrypt this array
                         pt, // store decrypted data here
                         &skey); // our previously scheduled key
    
    // now we have decrypted ct to the original plaintext in pt
    
    // Terminate the cipher context
    blowfish_done(&skey);
    std::string str2((char *)pt);
    json["cleartext"] = str2;
    return json;
  }
  
  /**
   * Handler for messages coming in from the browser via postMessage().
   *
   * @param {const pp::Var&} var_message A string representation of a JSON 
   * object. This is usually generated by JSON.stringify in the browser.
   * For example,
   *   var json_message = JSON.stringify({ "libraryFunction" : "helloWorld" });
   *   nacl_module.postMessage(json_message);
   * The JSON document contains {"libraryFunction":"functionToCall"}, 
   * Which specifies a function to call with the parsed JSON object.
   */
  virtual void HandleMessage(const pp::Var& var_message) {
    
    Json::Value root = parseJson(var_message);
    
    Json::Value resultJson;
    
    char function[64];
    
    // Key is loaded appropriately in key
    strcpy(function, root["libraryFunction"].asString().c_str());
    
    if(strcmp(kHelloWorld, function) == 0) {
      resultJson = root;
    } else if(strcmp(kLibTomCryptHelloWorldDecrypt, function) == 0) {
      resultJson = libTomCryptHelloWorldDecrypt(root);
    } else if(strcmp(kLibTomCryptHelloWorldEncrypt, function) == 0) {
      resultJson = libTomCryptHelloWorldEncrypt(root);
    }
    
    // Make a new JSON document to send back
    Json::StyledWriter writer;
    std::string result = writer.write( resultJson );
    
    pp::Var var_reply;
    
    var_reply = pp::Var(result);
    PostMessage(var_reply);
    
    
  }
};

/**
 * From Google's Documentation on the Native Client Architecture:
 * The Module class. The browser calls the CreateInstance() method to create
 * an instance of your NaCl module on the web page.  The browser creates a new
 * instance for each <embed> tag with type="application/x-nacl".
 **/
class CryptographyLibraryModule : public pp::Module {
 public:
  CryptographyLibraryModule() : pp::Module() {}
  virtual ~CryptographyLibraryModule() {}

  /**
   * Create and return a CryptographyLibraryInstance object.
   * @param {PP_Instance} instance The browser-side instance.
   * @return the plugin-side instance.
   */
  virtual pp::Instance* CreateInstance(PP_Instance instance) {
    return new CryptographyLibraryInstance(instance);
  }
};

namespace pp {

 /** 
  * From Google's Documentation on the Native Client Architecture:
  * Factory function called by the browser when the module is first loaded.
  * The browser keeps a singleton of this module.  It calls the
  * CreateInstance() method on the object you return to make instances.  There
  * is one instance per <embed> tag on the page.  This is the main binding
  * point for your NaCl module with the browser.
  **/
  Module* CreateModule() {
    return new CryptographyLibraryModule();
  }
}  // namespace pp
