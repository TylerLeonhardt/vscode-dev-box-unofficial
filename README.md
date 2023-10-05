# An Unofficial Dev Box extension for VS Code

## How to get your Dev Center endpoint

* looking at the "more info" section in https://devbox.microsoft.com on a particular dev box to get the dev center name
* Go to https://shell.azure.com and ensure you have the `devcenter` extension installed with `az extension add --name devcenter`
* `az login` because using the current session's credentials don't work for some reason
* `az devcenter dev dev-box list --dev-center-name "DEV_CENTER_NAME"` to get the dev box endpoint

It should look something like:
```
https://GUID-devcenter-DEVCENTER_NAME.REGION.devcenter.azure.com
```

## Features
* Start a dev box (command palette or the Dev Box tree view)
* Stop a dev box (command palette or the Dev Box tree view)
* Create a new dev box (command palette or the Dev Box tree view)
* Open a dev box in the browser (command palette or the Dev Box tree view)
* Delete a dev box (context menu of a dev box)
