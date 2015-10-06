#
# Runs each of the test sets defined below.
#
echo "This script steps through a series of test sets that run via Karma."
echo "Karma is a testing framework that will launch browsers and monitor files to re-run tests every time an edit is saved"
echo "!!!!!!"
echo "This will run all the tests currently defined in run_each.sh"
echo "You can also have tests run every time you save a file by defining the scripts you want to test with:"
echo "export FILES_TO_TEST=YOUR_FILES_HERE"
echo "Files are referenced relative to the privly-applications repository."
echo "Then you can issue 'karma start'"
echo "These tests are run only in the Chrome browser"
echo "!!!!!!"

# Change the current working directory to the directory of the run_each script
dir=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
cd $dir

# Default to running the tests locally
# If you want to run on Continuous Integration
# then you can pass "karma.conf-ci.js" as the first positional argument.
KARMA="../../privly-applications/test/karma.conf.js"
if [ ! -z "$1" ]
then
  KARMA=$1
fi

# We need to report back a non-zero number if any of the tests failed
declare -i ISFAIL=0

runTest () {
  echo ""
  echo "running tests on $1"
  echo ""
  export FILES_TO_TEST=$1

  # Determine whether this runs on CI or not
  if [ "$KARMA" == "../../privly-applications/test/karma.conf-ci.js" ]
  then
    karma start ../../privly-applications/test/karma.conf-ci.js --single-run --sauce-browsers=Chrome
  else
    karma start $KARMA --single-run --browsers Chrome
  fi
  ISFAIL=$(($ISFAIL|$?))
}

# These are the scripts that will be loaded for every test
commonScripts="vendor/jquery.min.js,../privly-applications/shared/javascripts/context_messenger.js"

# Each line below executes the scripts in order in the context of the browsers.
runTest "$commonScripts,../javascripts/content_scripts/privly.js,../javascripts/content_scripts/tests/privly.js"
runTest "$commonScripts,../javascripts/content_scripts/posting.resource.js,../javascripts/content_scripts/posting.util.js,../javascripts/content_scripts/posting.service.js,../javascripts/content_scripts/posting.controller.js,../javascripts/content_scripts/posting.app.js,../javascripts/content_scripts/posting.button.js,../javascripts/content_scripts/posting.floating.js,../javascripts/content_scripts/posting.tooltip.js,../javascripts/content_scripts/posting.ttlselect.js,../javascripts/content_scripts/posting.target.js,../javascripts/content_scripts/tests/posting.*.js"

if [ ! $ISFAIL -eq 0 ]
then
  echo "You have some work to do: tests are failing"
  exit 1
fi

exit 0
