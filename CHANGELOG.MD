
## v1.1.6

- process now exits with code 1 if it failed
- `checkoutinstallrc` is now loaded as default config file
- installer now runs in series (should be more reliable)
- bumping yargs@10 - should be fine

## v1.1.5

- fixed single repository run (my bad!).

## v1.1.4

- fix completely busted v1.1.3 (my bad!).

## v1.1.3

- fix name padding to be consistent.

## v1.1.2

- fixing how logic works in v1.1.1; will now properly npm install if it needs to.
- malformed config on repositories[0] wasn't returning the string properly.
- fix crash when links weren't provided.
- unit tests and coverage added as readme badges.

## v1.1.1

- attempt to run `npm install` if creating a new local branch.

## v1.1.0

- create a local branch for upstream tracking if it doesn't exist (thanks [BenHarrington](https://github.com/BenHarrington))

## v1.0.2

- fixing up readme badges

## v1.0.1

- fixing up readme badges

## v1.0.0

- initial commit.  it's functional!
