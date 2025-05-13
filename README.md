# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

---------
Deleting goal 681197e76df4cc03f208f84d with transfer options: {transferToSavingsAccount: true}
savingsGoalService.js:57 [savingsGoalService - deleteSavingsGoal] Deleting goal 681197e76df4cc03f208f84d with transfer options: {transferToSavingsAccount: true}transferToSavingsAccount: true[[Prototype]]: Object
xhr.js:195 
            
            
            DELETE http://localhost:5001/api/saving-goals/681197e76df4cc03f208f84d 404 (Not Found)
dispatchXhrRequest @ xhr.js:195
xhr @ xhr.js:15
dispatchRequest @ dispatchRequest.js:51
Promise.then
_request @ Axios.js:163
request @ Axios.js:40
Axios.<computed> @ Axios.js:213
wrap @ bind.js:5
deleteSavingsGoal @ savingsGoalService.js:58
handleDeleteGoal @ savingsGoalManager.jsx:105
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
userAxios.js:141  User-axios - Axios error: AxiosError {message: 'Request failed with status code 404', name: 'AxiosError', code: 'ERR_BAD_REQUEST', config: {…}, request: XMLHttpRequest, …}code: "ERR_BAD_REQUEST"config: {transitional: {…}, adapter: Array(3), transformRequest: Array(1), transformResponse: Array(1), timeout: 0, …}message: "Request failed with status code 404"name: "AxiosError"request: XMLHttpRequest {onreadystatechange: null, readyState: 4, timeout: 0, withCredentials: false, upload: XMLHttpRequestUpload, …}response: config: {transitional: {…}, adapter: Array(3), transformRequest: Array(1), transformResponse: Array(1), timeout: 0, …}data: {error: 'Savings goal not found'}headers: AxiosHeaders {content-length: '34', content-type: 'application/json; charset=utf-8'}request: XMLHttpRequest {onreadystatechange: null, readyState: 4, timeout: 0, withCredentials: false, upload: XMLHttpRequestUpload, …}status: 404statusText: "Not Found"[[Prototype]]: Objectstatus: 404stack: "AxiosError: Request failed with status code 404\n    at settle (http://localhost:5173/node_modules/.vite/deps/axios.js?v=c27fe738:1229:12)\n    at XMLHttpRequest.onloadend (http://localhost:5173/node_modules/.vite/deps/axios.js?v=c27fe738:1561:7)\n    at Axios.request (http://localhost:5173/node_modules/.vite/deps/axios.js?v=c27fe738:2119:41)\n    at async Object.deleteSavingsGoal (http://localhost:5173/src/services/savingsGoalService.js:58:30)\n    at async handleDeleteGoal (http://localhost:5173/src/components/SavingsGoal/savingsGoalManager.jsx:104:9)"[[Prototype]]: Error
(anonymous) @ userAxios.js:141
Promise.then
_request @ Axios.js:163
request @ Axios.js:40
Axios.<computed> @ Axios.js:213
wrap @ bind.js:5
deleteSavingsGoal @ savingsGoalService.js:58
handleDeleteGoal @ savingsGoalManager.jsx:105
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
savingsGoalService.js:66  [savingsGoalService - deleteSavingsGoal] Error deleting savings goal: AxiosError {message: 'Request failed with status code 404', name: 'AxiosError', code: 'ERR_BAD_REQUEST', config: {…}, request: XMLHttpRequest, …}
deleteSavingsGoal @ savingsGoalService.js:66
await in deleteSavingsGoal
handleDeleteGoal @ savingsGoalManager.jsx:105
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
savingsGoalService.js:68  Response status: 404
deleteSavingsGoal @ savingsGoalService.js:68
await in deleteSavingsGoal
handleDeleteGoal @ savingsGoalManager.jsx:105
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
savingsGoalService.js:69  Response data: {error: 'Savings goal not found'}
deleteSavingsGoal @ savingsGoalService.js:69
await in deleteSavingsGoal
handleDeleteGoal @ savingsGoalManager.jsx:105
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
savingsGoalManager.jsx:108  Failed to delete goal: AxiosError {message: 'Request failed with status code 404', name: 'AxiosError', code: 'ERR_BAD_REQUEST', config: {…}, request: XMLHttpRequest, …}code: "ERR_BAD_REQUEST"config: {transitional: {…}, adapter: Array(3), transformRequest: Array(1), transformResponse: Array(1), timeout: 0, …}message: "Request failed with status code 404"name: "AxiosError"request: XMLHttpRequest {onreadystatechange: null, readyState: 4, timeout: 0, withCredentials: false, upload: XMLHttpRequestUpload, …}response: config: {transitional: {…}, adapter: Array(3), transformRequest: Array(1), transformResponse: Array(1), timeout: 0, …}data: {error: 'Savings goal not found'}headers: AxiosHeaders {content-length: '34', content-type: 'application/json; charset=utf-8'}request: XMLHttpRequest {onreadystatechange: null, readyState: 4, timeout: 0, withCredentials: false, upload: XMLHttpRequestUpload, …}status: 404statusText: "Not Found"[[Prototype]]: Objectstatus: 404stack: "AxiosError: Request failed with status code 404\n    at settle (http://localhost:5173/node_modules/.vite/deps/axios.js?v=c27fe738:1229:12)\n    at XMLHttpRequest.onloadend (http://localhost:5173/node_modules/.vite/deps/axios.js?v=c27fe738:1561:7)\n    at Axios.request (http://localhost:5173/node_modules/.vite/deps/axios.js?v=c27fe738:2119:41)\n    at async Object.deleteSavingsGoal (http://localhost:5173/src/services/savingsGoalService.js:58:30)\n    at async handleDeleteGoal (http://localhost:5173/src/components/SavingsGoal/savingsGoalManager.jsx:104:9)"[[Prototype]]: Error
handleDeleteGoal @ savingsGoalManager.jsx:108
await in handleDeleteGoal
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
---
[2025-05-13T10:54:46.814Z] DELETE /api/saving-goals/681197e76df4cc03f208f84d
[SavingsGoalController - deleteSavingsGoal] Deleting goal 681197e76df4cc03f208f84d with transfer to savings account none or wallet none
---
# Delition of saving goal failed