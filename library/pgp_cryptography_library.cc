/* ECC -DH implementation*/
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
	
  // String identifier for the LibTomCryptHelloWorldSign function
  const char* const kLibTomCryptHelloWorldSign = 
    "libTomCryptHelloWorldSign";
  
  // String identifier for the LibTomCryptHelloWorldVerify function
  const char* const kLibTomCryptHelloWorldVerify = 
    "libTomCryptHelloWorldVerify";
  
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
   * Encrypting with other user's public keys
   *
   * @param {Json::Value} json The JSON object as parsed by parseJson.
   * @return {Json::Value} The same JSON object as sent to the library,
   * with the ciphertext added.
   */
  virtual Json::Value libTomCryptHelloWorldEncrypt(Json::Value json) {
    ecc_key       shareWithKey; //keys of the person(s) we are going to share the post with
    prng_state 		prng;
    int 			    err, hash_idx;
    unsigned char pt[64], ct[64], key[64], encoded[256];
	
    /* register yarrow */
    if (register_prng(&yarrow_desc) == -1) {
    	printf("Error registering Yarrow\n");
    	return -1;
    }
    /* setup the PRNG */
    if ((err = rng_make_prng(128, find_prng("yarrow"), &prng, NULL)) != CRYPT_OK) {
    	printf("Error setting up PRNG, %s\n", error_to_string(err));
    	return -1;
    }
    /* make a 192-bit ECC key ( If shareWithKey is loaded/imported from server then ecc_make_key() call is not required )*/
    if ((err = ecc_make_key(&prng, find_prng("yarrow"), 24, &shareWithKey)) != CRYPT_OK) {
    	printf("Error making key: %s\n", error_to_string(err));
    	return -1;
    }
    /*Register the hash Function */
    if (register_hash(&sha1_desc) == -1) {
    	printf("Error registering sha1");
    	return EXIT_FAILURE;
    }
    hash_idx = find_hash("sha1");
    /* Copy into pt the plaintext */
    strcpy((char*)pt, (char*)json["cleartext"].asString().c_str());

    /* Have to run this function for every key the post is shared with */
    if((err = ecc_encrypt_key(pt, sizeof(pt), ct, &outlen, &prng, find_prng("yarrow"), hash_idx, &shareWithKey) != CRYPT_OK) {
    	printf("ecc_encrypt_key %s", error_to_string(err));
    	return EXIT_FAILURE;
    }
    json["ciphertext"] = ct;
    return json;
  }
  
  /**
   * Decrypt a string using the private key of the person logged in
   *
   * @param {Json::Value} json The JSON object as parsed by parseJson.
   * @return {Json::Value} The same JSON object as sent to the library,
   * with the ciphertext added.
   */
  virtual Json::Value libTomCryptHelloWorldDecrypt(Json::Value json) {
    ecc_key 		    mykey;
    unsigned char 	pt[64], ct[64], key[64], encoded[256];
    unsigned long 	outlen;
    int 			      err;
    
    strcpy((char*)ct, json["ciphertext"].asString().c_str());

    /* Key is loaded here */
    if((err = ecc_decrypt_key(ct, sizeof(ct), pt, &outlen, &mykey) != CRYPT_OK) {
    	printf("ecc_decrypt_key %s", error_to_string(err));
    	return EXIT_FAILURE;
    }
    json["cleartext"] = pt;
    return json;
  }
  
  virtual Json::Value libTomCryptHelloWorldSign(Json::Value json) {
    
	
    ecc_key 		    mykey;
    unsigned char 	pt[64], sig[64], key[64], hash[16];
    unsigned long 	siglen;
    int 			      err;
    prng_state		  prng;
    hash_state      md;
    unsigned char *in = "hello world", out[16];
    /* setup the hash */
    md5_init(&md);
    /* add the message */
    md5_process(&md, pt, strlen(in));
    /* get the hash in out[0..15] */
    md5_done(&md, hash);
    /* register yarrow */

    if (register_prng(&yarrow_desc) == -1) {
    	printf("Error registering Yarrow\n");
    	return -1;
    }
    /* setup the PRNG */
    if ((err = rng_make_prng(128, find_prng("yarrow"), &prng, NULL)) != CRYPT_OK) {
    	printf("Error setting up PRNG, %s\n", error_to_string(err));
    	return -1;
    }

    /* Key is loaded here */

    if((err = ecc_sign_hash(hash, 15, sig, &siglen, &prng, find_prng("yarrow"), &mykey) != CRYPT_OK) {
    	printf("ecc_sign_hash %s", error_to_string(err));
    	return EXIT_FAILURE;
    }
    // add the signature
    json["signature"] = sig;
    json["hash"] = hash;
    return json;
  }
  
  virtual Json::Value libTomCryptHelloWorldVerify(Json::Value json) {
    
    ecc_key 		    mykey;
    unsigned char 	sig[64], ct[64], key[64], encoded[256];
    unsigned long 	siglen;
    int 			      err, stat;

    /* Key is loaded here */

    /* Verify the Signature against message Digest */
    if((err = ecc_verify_hash(sig, siglen, ct, sizeof(ct), &stat, &mykey) != CRYPT_OK) {
    	printf("ecc_decrypt_key %s", error_to_string(err));
    	return EXIT_FAILURE;
    }
    if(stat != 0) {
    	// Signature is valid
    }
    else {
    	//Signature is invalid
    }
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
    } else if(strcmp(kLibTomCryptHelloWorldSign, function) == 0) {
      resultJson = libTomCryptHelloWorldSign(root);
	} else if(strcmp(kLibTomCryptHelloWorldVerify, function) == 0) {
      resultJson = libTomCryptHelloWorldVerify(root);
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
