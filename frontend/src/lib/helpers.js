export const substituteParams = (text, params) => {
  for (const [key, value] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\[\\[!${key}!\\]\\]`, 'g'), value);
  }
  return text;
};
