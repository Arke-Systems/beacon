# Developing with Contentstack

For purposes of local development, individual developers should maintain their
own account and their own private development stack within Contentstack.

## Preparing your Stack

- Create a personal development stack. Be aware that integration tests run by
  the Beacon test suite will use this stack and will _wipe all data_ as part
  of the test process.

- In your stack settings, create a management token. The token should have
  **Write** permission to **All Branches**. Store the token in the `.env` file
  in the repository root, using the name `Contentstack_Management_Token`.
  This value should be treated like a password: do not commit your token to
  source control.

  ![Creating a management token](create-management-token.png)

- On the page detailing the management token, you will also find an API key.
  This API key is used to identify your stack specifically. Store the API key
  in your `.env` file, using the name `Contentstack_Api_Key`. This value is
  not sensitive, but you still probably have no reason to commit it to source
  control.
