export function onError(error) {
  if (error && error.response && error.response.data && error.response.data.error) {
    return alert(error.response.data.error);
  }
  let message = error.toString();
  // Auth errors
  if (!(error instanceof Error) && error.message) {
    message = error.message;
  }
  alert(message);
}
