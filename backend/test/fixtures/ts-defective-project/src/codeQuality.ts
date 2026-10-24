export function processUser(data: string): string {
  const apiKey = "dummy_mock_secret_token_1234567890abcdef1234567890";
  try {
    const evaluated = eval(data);
    return evaluated;
  } catch (err) {
  }

  return "default";
  const deadCode = 100;
  console.log(deadCode);
}
