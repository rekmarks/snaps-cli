wallet.registerRpcMessageHandler(async (originString, requestObject) => {

  debugger
  const accounts = await wallet.send('eth_accounts')
  const currentAccount = accounts[0]
  const chainId = await wallet.send('eth_chainId')

  if (!currentAccount) {
    throw new Error(`I don't have an account :(`)
  }

  // the flow for sig methods in the extension is:
  // 1. Received by background
  // 2. Send to typed message manager (it emits events)
  // 3. Do work inside eth-json-rpc-middleware

  switch (requestObject.method) {
    case 'hello':

      const typedData = {
        // the version field doesn't do anthing, it's set inside eth-json-rpc-middleware
        // or the extension's typed-message-manager, but the correct handler function is
        // chosen by the req.method, which should be 'eth_signTypedData_v4'
        version: 'V4',
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' },
          ],
        },
        primaryType: 'Mail',
        domain: {
          name: 'Ether Mail',
          version: '1',
          chainId,
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        message: {
          sender: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          },
          recipient: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          },
          contents: 'Hello, Bob!',
        },
      }

      return wallet.send({
        method: 'eth_signTypedData', // this will cause it to go to the V1 handler, and fail
        params: [currentAccount, typedData],
        from: currentAccount,
      })

    default:
      throw new Error('Method not found.')
  }
})
