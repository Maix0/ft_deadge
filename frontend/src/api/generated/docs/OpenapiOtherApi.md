# OpenapiOtherApi

All URIs are relative to *https://local.maix.me:8888*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**disableOtp**](OpenapiOtherApi.md#disableotp) | **PUT** /api/auth/disableOtp |  |
| [**enableOtp**](OpenapiOtherApi.md#enableotp) | **PUT** /api/auth/enableOtp |  |
| [**getUser**](OpenapiOtherApi.md#getuser) | **GET** /api/user/info/{user} |  |
| [**guestLogin**](OpenapiOtherApi.md#guestlogin) | **POST** /api/auth/guest |  |
| [**login**](OpenapiOtherApi.md#loginoperation) | **POST** /api/auth/login |  |
| [**loginOtp**](OpenapiOtherApi.md#loginotpoperation) | **POST** /api/auth/otp |  |
| [**logout**](OpenapiOtherApi.md#logout) | **POST** /api/auth/logout |  |
| [**providerList**](OpenapiOtherApi.md#providerlist) | **GET** /api/auth/providerList |  |
| [**signin**](OpenapiOtherApi.md#signin) | **POST** /api/auth/signin |  |
| [**statusOtp**](OpenapiOtherApi.md#statusotp) | **GET** /api/auth/statusOtp |  |



## disableOtp

> DisableOtp200Response disableOtp()



### Example

```ts
import {
  Configuration,
  OpenapiOtherApi,
} from '';
import type { DisableOtpRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new OpenapiOtherApi();

  try {
    const data = await api.disableOtp();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**DisableOtp200Response**](DisableOtp200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Default Response |  -  |
| **401** | Default Response |  -  |
| **500** | Default Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## enableOtp

> EnableOtp200Response enableOtp()



### Example

```ts
import {
  Configuration,
  OpenapiOtherApi,
} from '';
import type { EnableOtpRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new OpenapiOtherApi();

  try {
    const data = await api.enableOtp();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**EnableOtp200Response**](EnableOtp200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Default Response |  -  |
| **401** | Default Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getUser

> GetUser200Response getUser(user)



### Example

```ts
import {
  Configuration,
  OpenapiOtherApi,
} from '';
import type { GetUserRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new OpenapiOtherApi();

  const body = {
    // GetUserUserParameter
    user: ...,
  } satisfies GetUserRequest;

  try {
    const data = await api.getUser(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **user** | [](.md) |  | [Defaults to `undefined`] |

### Return type

[**GetUser200Response**](GetUser200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Default Response |  -  |
| **401** | Default Response |  -  |
| **403** | Default Response |  -  |
| **404** | Default Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## guestLogin

> GuestLogin200Response guestLogin()



### Example

```ts
import {
  Configuration,
  OpenapiOtherApi,
} from '';
import type { GuestLoginRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new OpenapiOtherApi();

  try {
    const data = await api.guestLogin();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**GuestLogin200Response**](GuestLogin200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Default Response |  -  |
| **500** | Default Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## login

> Login200Response login(loginRequest)



### Example

```ts
import {
  Configuration,
  OpenapiOtherApi,
} from '';
import type { LoginOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new OpenapiOtherApi();

  const body = {
    // LoginRequest
    loginRequest: ...,
  } satisfies LoginOperationRequest;

  try {
    const data = await api.login(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **loginRequest** | [LoginRequest](LoginRequest.md) |  | |

### Return type

[**Login200Response**](Login200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Default Response |  -  |
| **202** | Default Response |  -  |
| **400** | Default Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## loginOtp

> LoginOtp200Response loginOtp(loginOtpRequest)



### Example

```ts
import {
  Configuration,
  OpenapiOtherApi,
} from '';
import type { LoginOtpOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new OpenapiOtherApi();

  const body = {
    // LoginOtpRequest
    loginOtpRequest: ...,
  } satisfies LoginOtpOperationRequest;

  try {
    const data = await api.loginOtp(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **loginOtpRequest** | [LoginOtpRequest](LoginOtpRequest.md) |  | |

### Return type

[**LoginOtp200Response**](LoginOtp200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Default Response |  -  |
| **400** | Default Response |  -  |
| **401** | Default Response |  -  |
| **408** | Default Response |  -  |
| **500** | Default Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## logout

> Logout200Response logout()



### Example

```ts
import {
  Configuration,
  OpenapiOtherApi,
} from '';
import type { LogoutRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new OpenapiOtherApi();

  try {
    const data = await api.logout();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**Logout200Response**](Logout200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Default Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## providerList

> ProviderList200Response providerList()



### Example

```ts
import {
  Configuration,
  OpenapiOtherApi,
} from '';
import type { ProviderListRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new OpenapiOtherApi();

  try {
    const data = await api.providerList();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**ProviderList200Response**](ProviderList200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Default Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## signin

> Signin200Response signin(loginRequest)



### Example

```ts
import {
  Configuration,
  OpenapiOtherApi,
} from '';
import type { SigninRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new OpenapiOtherApi();

  const body = {
    // LoginRequest
    loginRequest: ...,
  } satisfies SigninRequest;

  try {
    const data = await api.signin(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **loginRequest** | [LoginRequest](LoginRequest.md) |  | |

### Return type

[**Signin200Response**](Signin200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Default Response |  -  |
| **400** | Default Response |  -  |
| **500** | Default Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## statusOtp

> StatusOtp200Response statusOtp()



### Example

```ts
import {
  Configuration,
  OpenapiOtherApi,
} from '';
import type { StatusOtpRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new OpenapiOtherApi();

  try {
    const data = await api.statusOtp();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**StatusOtp200Response**](StatusOtp200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Default Response |  -  |
| **401** | Default Response |  -  |
| **500** | Default Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

