#!/bin/bash -e
#
# Purpose: Pack a Chromium extension directory into crx format
# so it can be served by TravisCI. This script involves
# signing the extension, but the signature will be ignored.
# DO NOT TRUST THESE SIGNATURES. THE PRIVATE KEY IS PUBLIC
# INFORMATION.

# Change to the directory of the script
cd "$(dirname "$0")"

key="travis.pem"
pub="travis.pub"
sig="travis.sig"
crx="../PrivlyChromeExtension.crx"
zip="../PrivlyChromeExtension.zip"

# zip up the extension
cd ..
./package.sh
cd package

# signature
openssl sha1 -sha1 -binary -sign "$key" < "$zip" > "$sig"

# public key
openssl rsa -pubout -outform DER < "$key" > "$pub"

byte_swap () {
  # Take "abcdefgh" and return it as "ghefcdab"
  echo "${1:6:2}${1:4:2}${1:2:2}${1:0:2}"
}

crmagic_hex="4372 3234" # Cr24
version_hex="0200 0000" # 2
pub_len_hex=$(byte_swap $(printf '%08x\n' $(ls -l "$pub" | awk '{print $5}')))
sig_len_hex=$(byte_swap $(printf '%08x\n' $(ls -l "$sig" | awk '{print $5}')))
(
  echo "$crmagic_hex $version_hex $pub_len_hex $sig_len_hex" | xxd -r -p
  cat "$pub" "$sig" "$zip"
) > "$crx"
echo "Wrote $crx"
