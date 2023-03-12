import { TOP_LEVEL_ADMIN_GROUP } from "../constants";
import handler from "../handler";

describe('handler', () => {
  test('returns the expected result', async () => {
    // Mock the event and context objects
    const event = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              'custom:tenant': 'test',
              'cognito:groups': ['admin'],
            },
          },
        },
      },
    };
    const context = {};

    // Create a test Lambda function
    const lambda = jest.fn(async (event, tenant, context) => {
      return { message: `Hello, ${tenant}!` };
    });
    // Call the handler function
    const result = await handler(lambda)(event, context);

    // Assert that the function returns the expected result
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe('{"message":"Hello, test!"}');
    expect(result.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    });
  });
});



describe('handler', () => {
  it('should return a response object with a 200 status code and body from the lambda function', async () => {
    // Create mock event and context objects
    const event = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              'custom:tenant': 'test-tenant'
            }
          }
        }
      }
    };
    const context = {};

    // Create a mock implementation of the lambda function
    const mockLambda = jest.fn().mockResolvedValue({ foo: 'bar' });

    // Call the handler function with the mock lambda function and input objects
    const result = await handler(mockLambda)(event, context);

    // Assert that the response object has the expected properties
    expect(result.statusCode).toEqual(200);
    expect(result.body).toEqual('{"foo":"bar"}');
    expect(result.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    });
  });


  it('should return a response object with a 500 status code and error message when an error occurs', async () => {
    // Create mock event and context objects
    const event = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              'custom:tenant': 'test-tenant'
            }
          }
        }
      }
    };
    const context = {};

    // Create a mock implementation of the lambda function that throws an error
    const mockLambda = jest.fn().mockRejectedValue(new Error('Test error'));

    // Call the handler function with the mock lambda function and input objects
    const result = await handler(mockLambda)(event, context);

    // Assert that the response object has the expected properties
    expect(result.statusCode).toEqual(500);
    expect(result.body).toEqual('{"error":"Test error"}');
    expect(result.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    });
  })});



describe('handler', () => {
  beforeEach(() => {
    process.env.ALLOWED_GROUPS = TOP_LEVEL_ADMIN_GROUP; // set the allowed groups environment variable
  });

  afterEach(() => {
    delete process.env.ALLOWED_GROUPS; // reset the environment variable
  });

  it('should return 200 status code when user is in allowed group', async () => {
    const mockLambda = jest.fn().mockResolvedValue({ foo: 'bar' });
    const event = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              'cognito:groups': [TOP_LEVEL_ADMIN_GROUP],
              'custom:tenant': 'tenant'
            }
          }
        }
      }
    };
    const context = {};

    const result = await handler(mockLambda)(event, context);

    expect(mockLambda).toHaveBeenCalledWith(event, 'tenant', context); // assert that mockLambda was called with the correct arguments
    expect(result.statusCode).toBe(200); // assert that the status code is 200
    expect(JSON.parse(result.body)).toEqual({ foo: 'bar' }); // assert that the body is what we expect
  });

  it('should return 403 status code when user is not in allowed group', async () => {
    const mockLambda = jest.fn().mockResolvedValue({ foo: 'bar' });
    const event = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              'cognito:groups': ['some-other-group']
            }
          }
        }
      }
    };
    const context = {};

    const result = await handler(mockLambda)(event, context);

    expect(mockLambda).not.toHaveBeenCalled(); // assert that mockLambda was not called
    expect(result.statusCode).toBe(403); // assert that the status code is 403
    expect(JSON.parse(result.body)).toEqual({ error: 'Unauthorised' }); // assert that the body is what we expect
  });
});
