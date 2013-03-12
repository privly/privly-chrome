# Build Instructions

Privly's compiled libraries are built for Google's [Native Client](http://en.wikipedia.org/wiki/Google_Native_Client) (NaCl), which provides double sandboxing and a plugin API. To operate in the double sandbox, libraries lose full system access and must be ported to make use of the sandbox's system API. Examples of ported libraries can be found in the [NaCl Ports repository](https://code.google.com/p/naclports/).

This guide will step you through fetching the NaCl build environment, and compiling Privly's libraries and a "hello world" application. 

## 0. Prerequisites

This guide currently assumes a *nix architecture, but the steps should be adaptable to windows if you can understand the *nix variant.

You should have the ability to checkout an SVN repository. 

## 1. Setup the NaCl SDK

Follow [these steps](https://developers.google.com/native-client/sdk/download) for your platform to download and install the NaCl SDK. Upon completion of the steps, make sure you have the Pepper 23 package installed. We will be building libraries for Pepper 23.

## 2. Build the NaCl Ports Libraries

Now that you have the build environment setup, you can fetch and build a few of the external dependencies. Integration with NaCl is far easier if you select libraries from the (limited) list of ports in the [NaCl Ports repository](https://code.google.com/p/naclports/). We are going to grab two libraries from NaCl, [jsoncpp](http://jsoncpp.sourceforge.net/) for the messaging interface, and [libTomCrypt](https://github.com/libtom/libtomcrypt) to spec cryptography functions. 

NaCl Ports hosts patch files, not projects. It will automatically fetch, patch, and build projects for the NaCl tool chain in the current version of the NaCl SDK. 

1. Set the version of the NaCl SDK. We are using pepper 23 for compatibility reasons, issue: `export NACL_SDK_ROOT=/YOUR/PATH/TO/nacl_sdk/pepper_23`
1. Get the current NaCl ports repository, issue: `svn checkout http://naclports.googlecode.com/svn/trunk/src naclports`
1. Change directories to the jsoncpp library `cd naclports/libraries/jsoncpp`
1. Download and build the JsonCPP by running its script: `./nacl-jsoncpp.sh`
1. Download and build libTomCrypt in the same way you did for JsonCPP: `cd ../libtomcrypt/`, then `./nacl-libtomcrypt.sh`

Now you can reference jsonCPP and libTomCrypt from the extension's code so long as you have the `NACL_SDK_ROOT` environment variable set.

## 3. Compile the extension's C++ code

1. Set the version of the NaCl SDK. We are using pepper 23 for compatibility reasons, issue: `export NACL_SDK_ROOT=/YOUR/PATH/TO/nacl_sdk/pepper_23`
1. Change to the extension's library directory, `cd /YOUR/PATH/TO/privly-chrome/library`
1. Issue `make`

## 4. Testing

Now when you reload the extension, you can view the results of a few test cases by opening Chrome's Extension Management page, and clicking inspect view's "background.html".
