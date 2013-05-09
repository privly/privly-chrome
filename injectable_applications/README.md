##Architecture of Injectable Applications##

The injectable application folder is a repository inside another repository. 
This is created with fake submodules using a method using the following commands:

git clone git://github.com/privly/privly-applications privly-applications

git add privly-applications/

emphasis on the slash at the end making git see the files in the subdirectory
ignoring the fact that it is in itself a different repository.
The implications about this method is that you cannot go into the injectable-applications
folder and simply git pull it. If you absolutely need to do that you can just use:

rm -rf injectable_applications 

and then replace it with a clone yourself. 

Fake submodule technique taken from: [this site] (http://debuggable.com/posts/git-fake-submodules:4b563ee4-f3cc-4061-967e-0e48cbdd56cb)
