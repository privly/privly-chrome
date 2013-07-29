This directory contains the set of current injectable applications supported by
the platform.

If you want to make changes to the code found in this directory, you should 
look at the repository found 
[here](https://github.com/privly/privly-applications) and make a pull
request there.

If you are developing an application within a specific architecture (eg rails
or Chrome), then we recommend using the method found below to embed the 
privly-applications repository within this one. It simplifies the process of
developing against the two repositories.

## Tie This Directory to the Privly-Applications Repository ##

First remove this directory by going to the parent directory and issuing:

`rm -rf privly-applications`

Now you can clone the privly-applications **repository** into this directory:

    git clone git://github.com/privly/privly-applications privly-applications
    git add privly-applications/

emphasis on the slash at the end making git see the files in the subdirectory
ignoring the fact that it is in itself a different repository. The 
implications of this method is that you can go into the 
privly-applications folder and simply `git pull` or `git commit` it.

To read more about this approach, checkout
[this site](http://debuggable.com/posts/git-fake-submodules:4b563ee4-f3cc-4061-967e-0e48cbdd56cb).
