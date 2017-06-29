# Coverage Test Service

> Node.js backend service listening over MQTT and plotting into Google Sheets

## Prepare a New Google Sheet To Be Used

1. Go to the [Google Developers Console](https://console.developers.google.com/project)
2. Select your project or create a new one (and select it)
3. Enable the Drive API for your project
   * In the sidebar on the left, click **Library**
   * Search for "drive"
   * Click on "Google Drive API"
   * Click the blue "Enable API" button

4. Create a service account key for your project
   * In the sidebar on the left, click **Credentials**
   * Click the "Create credentials" button
   * Select the "Service account key" option
   * Select "New service account" in the dropdown
   * Give it a name and select **Project > Editor** as the role
   * Click the "Create" button
   * Your JSON key file is generated and downloaded to your machine (**only copy!**)
   * Note down your service account's email (available in the JSON key file)

5. Share the doc with your service account using the email noted above
6. Copy the contents of the JSON key file into [client_secret.json](https://github.com/Pwntus/coverage-test-service/blob/master/client_secret.json).

## Installation

Install Node dependencies:

```
npm install
```

## Run Service

```
node client.js -u <username> -p <password> -t 'thing-update/<domain>/<thing ID>' -s '<sheet ID>'
```

You can also edit the `start` script in [package.json](https://github.com/Pwntus/coverage-test-service/blob/master/package.json) and run the service by:

```
npm run start
```

### Parameters

**-u** : MIC username

**-p** : MIC password

**-t** : MQTT topic

**-s** : Google Sheet ID
