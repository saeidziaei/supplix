export const substituteParams = (text, params) => {
  for (const [key, value] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\[\\[!${key}!\\]\\]`, 'g'), value);
  }
  return text;
};

export const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const normaliseCognitoUsers = (cUsers) => {
  if (!cUsers || cUsers.length === 0) return null;

  return cUsers.map(cu => ({
    Username: cu.Username,
    isAdmin: cu.isAdmin,
    isTopLevelAdmin: cu.isTopLevelAdmin,
    Enabled: cu.Enabled,
    UserStatus: cu.UserStatus,
    given_name: getAttribute(cu, "given_name"),
    family_name: getAttribute(cu, "family_name"),
    email: getAttribute(cu, "email"),
    email_verified: getAttribute(cu, "email_verified"),
    phone_number: getAttribute(cu, "phone_number"),
    ...cu
  }));
}
export const getUserById = (users, id) => {
  let user = users.find(u => u.Username === id);
  return user || {given_name: '', family_name: ''};
}


function getAttribute(user, attributeName) {
  const attribute = user.Attributes.find(
    (attr) => attr.Name === attributeName
  );
  if (attribute) {
    return attribute.Value;
  } else {
    return "";
  }
}