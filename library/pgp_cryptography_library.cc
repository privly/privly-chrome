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
    
    unsigned char     pt[64], ct[64], key[64], encoded[256], hash[MAXBLOCKSIZE], sig[64];;
    symmetric_key     skey; 
    int               err, hash_idx, outlen;
    long unsigned int encodedLength[1] = {256};
    unsigned long     hashLen, siglen;
    ecc_key           senderPrivateKey, receiverPublicKey; 
    prng_state        prng;
    
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
    /// KEY ENCRYPTION USING ECC -DH : START
    /* The key used to encrypt the plaintext is encrypted* with the public key of the person(s) the post is shared with*/
    

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
    if ((err = ecc_make_key(&prng, find_prng("yarrow"), 24, &receiverPublicKey)) != CRYPT_OK) {
      printf("Error making key: %s\n", error_to_string(err));
      return -1;
    }
    /*Register the hash Function */
    if (register_hash(&sha1_desc) == -1) {
      printf("Error registering sha1");
      return EXIT_FAILURE;
    }
    hash_idx = find_hash("sha1");
    
    /* Have to run this function for public shareWithKey the post is shared with */
    if((err = ecc_encrypt_key(key, sizeof(key)/8, ct, &outlen, &prng, find_prng("yarrow"), hash_idx, &receiverPublicKey) != CRYPT_OK) {
    	printf("ecc_encrypt_key %s", error_to_string(err));
    	return EXIT_FAILURE;
    }
    // the encrypted symmetric key is added to the json object
    std::string str1((char *)ct);
    json["encskey"] = str1; 
    /// key encryption using ECC - DH END
	
    /// FINDING THE HASH AND SIGNING : START
    /* Create message digest and encrypt it with senders private key */
    
    /* register the hash */
    if (register_hash(&sha1_desc) == -1) {
		  printf("Error registering MD5.\n");
		  return -1;
    }
    /* get the index of the hash */
    hash_idx = find_hash("sha1");
    /* call the hash */
	  len = sizeof(out);
	  if ((err = hash_memory(hash_idx, pt, sizeof(pt), hash, &hashLen)) != CRYPT_OK) {
		  printf("Error hashing data: %s\n", error_to_string(err));
		  return -1;
    }
    if (register_prng(&yarrow_desc) == -1) {
    	printf("Error registering Yarrow\n");
    	return -1;
    }
    /* setup the PRNG */
    if ((err = rng_make_prng(128, find_prng("yarrow"), &prng, NULL)) != CRYPT_OK) {
    	printf("Error setting up PRNG, %s\n", error_to_string(err));
    	return -1;
    }
    /* Sign the hash with senders private key */
    if((err = ecc_sign_hash(hash, sizeof(hash)/8, sig, &siglen, &prng, find_prng("yarrow"), &senderPrivateKey) != CRYPT_OK) {
    	printf("ecc_sign_hash %s", error_to_string(err));
    	return EXIT_FAILURE;
    }
    // add the signature
    std::string str2((char *)sig);
    std::string str3((char *)hash);
    json["signature"] = str2;
    json["hash"] = str3;
    /// FINDING THE HASH AND SIGNING : END
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
    
    unsigned char   pt[64], ct[64], key[64], encoded[256], encryptedSymmetricKey[64];
    symmetric_key   skey; 
    int 		      	err, hash_idx;
    unsigned long   decodedLength[1] = {256};
    unsigned char   sig[64], hash[64];
    unsigned long   hashLen, siglen;
    int             stat;
    ecc_key         senderPublicKey;
    ecc_key         receiverPrivateKey;  //The private key
    unsigned long   outlen;
    unsigned long   verifyHashLen;
    unsigned char   verifyHash[MAXBLOCKSIZE];
    
    strcpy((char*)sig, json["signature"].asString().c_str());

    strcpy((char*)hash, json["hash"].asString().c_str());

    strcpy((char*)encoded, json["ciphertext"].asString().c_str());

    // The encrypted symmetric key is loaded from the json object
    strcpy((char*)encryptedSymmetricKey, json["encskey"].asString().c_str());

    /// DECRYPT THE ENCRYPTED SYMMETRIC KEY TO GET THE ORIGINAL
    /// SYMMECTRIC KEY USING ECC-DH : START
    
    
    /* TO DO - ADD CODE TO LOAD receiver's Private key into receiverPrivateKey variable*/
	
    // Decrypt to get symmetric key
    if((err = ecc_decrypt_key(encryptedSymmetricKey, sizeof(encryptedSymmetricKey), key, &outlen, &receiverPrivateKey) != CRYPT_OK) {
    	printf("ecc_decrypt_key %s", error_to_string(err));
    	return EXIT_FAILURE;
    }
    /// DECRYPT THE ENCRYPTED SYMMETRIC KEY TO GET THE ORIGINAL
    /// SYMMECTRIC KEY USING ECC-DH : END
    
    err = base64_decode(encoded, 256, ct, decodedLength);
    
    // The following line is not necessary as the 
    // symmetric key is stored in variable key by above function call
    //strcpy((char*)key, "key");

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
    /// VERIFY THAT THE PLAINTEXT IS ACTUALLY WHAT WAS SENT : START
    
    /* register the hash */
    if (register_hash(&sha1_desc) == -1) {
      printf("Error registering MD5.\n");
      return -1;
    }
    /* get the index of the hash */
    hash_idx = find_hash("sha1");
    /* call the hash */
    len = sizeof(out);
    if ((err = hash_memory(hash_idx, pt, sizeof(pt), verifyHash, &verifyHashLen)) != CRYPT_OK) {
      printf("Error hashing data: %s\n", error_to_string(err));
      return -1;
    }
    if(strcmp(hash,verifyHash) != 0) {
      // Implies that the post was not shared with this person
      // EXIT 
    }
    else {
      //Post was shared with this person
    }
    /// VERIFY THAT THE PLAINTEXT IS ACTUALLY WHAT WAS SENT : END
    
    // Terminate the cipher context
    blowfish_done(&skey);
    std::string str2((char *)pt);
    json["cleartext"] = str2;
    /// VERIFYING THE RECIEVED MESSAGE : START
    
    
    /* Verify the Signature against message Digest */
    if((err = ecc_verify_hash(sig, sizeof(sig)/8, hash, sizeof(hash), &stat, &senderPublicKey) != CRYPT_OK) {
    	printf("ecc_decrypt_key %s", error_to_string(err));
    	return EXIT_FAILURE;
    }
    if(stat != 0) {
    	/* Signature is valid */
		/* Set a flag to represent the correctness and credibility */
    }
    else {
    	//Signature is invalid
    }
    /// VERIFYING THE RECIEVED MESSAGE : END
	 
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