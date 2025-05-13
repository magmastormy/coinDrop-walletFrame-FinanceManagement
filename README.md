# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

---------
Deleting goal 681197e76df4cc03f208f84d with transfer options: {transferToSavingsAccount: true}
savingsGoalService.js:65 [savingsGoalService - deleteSavingsGoal][op-1747158845750-zk8ks] Deleting goal 681197e76df4cc03f208f84d and transferring balance to none
savingsGoalService.js:79 [savingsGoalService - deleteSavingsGoal][op-1747158845750-zk8ks] Request data: {transferToSavingsAccount: true, operationId: 'op-1747158845750-zk8ks', userId: '680de81deb82d2139a817816'}
xhr.js:195 
            
            
            DELETE http://localhost:5001/api/saving-goals/681197e76df4cc03f208f84d 500 (Internal Server Error)
dispatchXhrRequest @ xhr.js:195
xhr @ xhr.js:15
dispatchRequest @ dispatchRequest.js:51
Promise.then
_request @ Axios.js:163
request @ Axios.js:40
Axios.<computed> @ Axios.js:213
wrap @ bind.js:5
deleteSavingsGoal @ savingsGoalService.js:82
handleDeleteGoal @ savingsGoalManager.jsx:99
onClick @ savingsGoalCard.jsx:163
callCallback2 @ react-dom.development.js:4164
invokeGuardedCallbackDev @ react-dom.development.js:4213
invokeGuardedCallback @ react-dom.development.js:4277
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:4291
executeDispatch @ react-dom.development.js:9041
processDispatchQueueItemsInOrder @ react-dom.development.js:9073
processDispatchQueue @ react-dom.development.js:9086
dispatchEventsForPlugins @ react-dom.development.js:9097
(anonymous) @ react-dom.development.js:9288
batchedUpdates$1 @ react-dom.development.js:26179
batchedUpdates @ react-dom.development.js:3991
dispatchEventForPluginEventSystem @ react-dom.development.js:9287
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ react-dom.development.js:6465
dispatchEvent @ react-dom.development.js:6457
dispatchDiscreteEvent @ react-dom.development.js:6430
userAxios.js:141  User-axios - Axios error: AxiosError {message: 'Request failed with status code 500', name: 'AxiosError', code: 'ERR_BAD_RESPONSE', config: {…}, request: XMLHttpRequest, …}code: "ERR_BAD_RESPONSE"config: {transitional: {…}, adapter: Array(3), transformRequest: Array(1), transformResponse: Array(1), timeout: 10000, …}message: "Request failed with status code 500"name: "AxiosError"request: XMLHttpRequest {onreadystatechange: null, readyState: 4, timeout: 10000, withCredentials: false, upload: XMLHttpRequestUpload, …}response: {data: {…}, status: 500, statusText: 'Internal Server Error', headers: AxiosHeaders, config: {…}, …}status: 500stack: "AxiosError: Request failed with status code 500\n    at settle (http://localhost:5173/node_modules/.vite/deps/axios.js?v=c27fe738:1229:12)\n    at XMLHttpRequest.onloadend (http://localhost:5173/node_modules/.vite/deps/axios.js?v=c27fe738:1561:7)\n    at Axios.request (http://localhost:5173/node_modules/.vite/deps/axios.js?v=c27fe738:2119:41)\n    at async Object.deleteSavingsGoal (http://localhost:5173/src/services/savingsGoalService.js:82:30)\n    at async handleDeleteGoal (http://localhost:5173/src/components/SavingsGoal/savingsGoalManager.jsx:104:24)"[[Prototype]]: Error
(anonymous) @ userAxios.js:141
Promise.then
_request @ Axios.js:163
request @ Axios.js:40
Axios.<computed> @ Axios.js:213
wrap @ bind.js:5
deleteSavingsGoal @ savingsGoalService.js:82
handleDeleteGoal @ savingsGoalManager.jsx:99
onClick @ savingsGoalCard.jsx:163
callCallback2 @ react-dom.development.js:4164
invokeGuardedCallbackDev @ react-dom.development.js:4213
invokeGuardedCallback @ react-dom.development.js:4277
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:4291
executeDispatch @ react-dom.development.js:9041
processDispatchQueueItemsInOrder @ react-dom.development.js:9073
processDispatchQueue @ react-dom.development.js:9086
dispatchEventsForPlugins @ react-dom.development.js:9097
(anonymous) @ react-dom.development.js:9288
batchedUpdates$1 @ react-dom.development.js:26179
batchedUpdates @ react-dom.development.js:3991
dispatchEventForPluginEventSystem @ react-dom.development.js:9287
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ react-dom.development.js:6465
dispatchEvent @ react-dom.development.js:6457
dispatchDiscreteEvent @ react-dom.development.js:6430
savingsGoalService.js:113  [savingsGoalService - deleteSavingsGoal][op-1747158845750-zk8ks] Response error: {operationId: 'op-1747158845750-zk8ks', timestamp: '2025-05-13T17:54:07.864Z', goalId: '681197e76df4cc03f208f84d', transferOptions: {…}, errorMessage: 'Request failed with status code 500', …}errorMessage: "Request failed with status code 500"goalId: "681197e76df4cc03f208f84d"operationId: "op-1747158845750-zk8ks"requestData: "{\"transferToSavingsAccount\":true,\"operationId\":\"op-1747158845750-zk8ks\",\"userId\":\"680de81deb82d2139a817816\"}"requestUrl: "/saving-goals/681197e76df4cc03f208f84d"responseData: {error: 'Failed to transfer funds from savings goal', details: 'Caused by :: Write conflict during plan execution …try your operation or multi-document transaction.'}responseStatus: 500stack: "AxiosError: Request failed with status code 500\n    at settle (http://localhost:5173/node_modules/.vite/deps/axios.js?v=c27fe738:1229:12)\n    at XMLHttpRequest.onloadend (http://localhost:5173/node_modules/.vite/deps/axios.js?v=c27fe738:1561:7)\n    at Axios.request (http://localhost:5173/node_modules/.vite/deps/axios.js?v=c27fe738:2119:41)\n    at async Object.deleteSavingsGoal (http://localhost:5173/src/services/savingsGoalService.js:82:30)\n    at async handleDeleteGoal (http://localhost:5173/src/components/SavingsGoal/savingsGoalManager.jsx:104:24)"timestamp: "2025-05-13T17:54:07.864Z"transferOptions: {transferToSavingsAccount: true}[[Prototype]]: Object
deleteSavingsGoal @ savingsGoalService.js:113
await in deleteSavingsGoal
handleDeleteGoal @ savingsGoalManager.jsx:99
onClick @ savingsGoalCard.jsx:163
callCallback2 @ react-dom.development.js:4164
invokeGuardedCallbackDev @ react-dom.development.js:4213
invokeGuardedCallback @ react-dom.development.js:4277
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:4291
executeDispatch @ react-dom.development.js:9041
processDispatchQueueItemsInOrder @ react-dom.development.js:9073
processDispatchQueue @ react-dom.development.js:9086
dispatchEventsForPlugins @ react-dom.development.js:9097
(anonymous) @ react-dom.development.js:9288
batchedUpdates$1 @ react-dom.development.js:26179
batchedUpdates @ react-dom.development.js:3991
dispatchEventForPluginEventSystem @ react-dom.development.js:9287
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ react-dom.development.js:6465
dispatchEvent @ react-dom.development.js:6457
dispatchDiscreteEvent @ react-dom.development.js:6430
savingsGoalManager.jsx:109  Failed to delete goal: 
--
[SavingsGoalController - deleteSavingsGoal][op-1747158845750-zk8ks] Starting deletion process
[SavingsGoalController - deleteSavingsGoal][op-1747158845750-zk8ks] User ID sources: {
  fromToken: '680de81deb82d2139a817816',
  fromQuery: 'none',
  fromBody: '680de81deb82d2139a817816',
  selected: '680de81deb82d2139a817816'
}
[SavingsGoalController - deleteSavingsGoal][op-1747158845750-zk8ks] Deleting goal 681197e76df4cc03f208f84d with transfer to savings account none or wallet none
[SavingsGoalController - deleteSavingsGoal] Found goal with amount: 20
[SavingsGoalController - deleteSavingsGoal] No target account specified, transferring 20 to savings account 6811978c6df4cc03f208f841
[SavingsGoalController - deleteSavingsGoal] Error transferring funds: MongoServerError: Caused by :: Write conflict during plan execution and yielding is disabled. :: Please retry your operation or multi-document transaction.
    at Connection.sendCommand (C:\Users\Administrator\Documents\reactProjects\coinDrip\coinDrop\backend\node_modules\mongodb\lib\cmap\connection.js:299:27)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async Connection.command (C:\Users\Administrator\Documents\reactProjects\coinDrip\coinDrop\backend\node_modules\mongodb\lib\cmap\connection.js:327:26)
    at async Server.command (C:\Users\Administrator\Documents\reactProjects\coinDrip\coinDrop\backend\node_modules\mongodb\lib\sdam\server.js:168:29)
    at async UpdateOneOperation.executeCommand (C:\Users\Administrator\Documents\reactProjects\coinDrip\coinDrop\backend\node_modules\mongodb\lib\operations\command.js:76:16)
    at async UpdateOneOperation.execute (C:\Users\Administrator\Documents\reactProjects\coinDrip\coinDrop\backend\node_modules\mongodb\lib\operations\update.js:55:21)
    at async UpdateOneOperation.execute (C:\Users\Administrator\Documents\reactProjects\coinDrip\coinDrop\backend\node_modules\mongodb\lib\operations\update.js:69:21)
    at async tryOperation (C:\Users\Administrator\Documents\reactProjects\coinDrip\coinDrop\backend\node_modules\mongodb\lib\operations\execute_operation.js:207:20)
    at async executeOperation (C:\Users\Administrator\Documents\reactProjects\coinDrip\coinDrop\backend\node_modules\mongodb\lib\operations\execute_operation.js:75:16)
    at async Collection.updateOne (C:\Users\Administrator\Documents\reactProjects\coinDrip\coinDrop\backend\node_modules\mongodb\lib\collection.js:207:16) {
  errorLabelSet: Set(1) { 'TransientTransactionError' },
  errorResponse: {
    errorLabels: [ 'TransientTransactionError' ],
    ok: 0,
    errmsg: 'Caused by :: Write conflict during plan execution and yielding is disabled. :: Please retry your operation or multi-document transaction.',
    code: 112,
    codeName: 'WriteConflict',
    '$clusterTime': {
      clusterTime: new Timestamp({ t: 1747158847, i: 66 }),
      signature: [Object]
    },
    operationTime: new Timestamp({ t: 1747158847, i: 66 })
  },
  ok: 0,
  code: 112,
  codeName: 'WriteConflict',
  '$clusterTime': {
    clusterTime: new Timestamp({ t: 1747158847, i: 66 }),
    signature: {
      hash: Binary.createFromBase64('VI+Mk/E8SbTEuT6JWVZi6P5gOg0=', 0),
      keyId: new Long('7461309390969110556')
    }
  },
  operationTime: new Timestamp({ t: 1747158847, i: 66 })
}