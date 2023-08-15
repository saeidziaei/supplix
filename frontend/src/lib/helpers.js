import { parseISO } from "date-fns";

export const substituteParams = (text, params) => {
  for (const [key, value] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\[\\[!${key}!\\]\\]`, 'g'), value);
  }
  return text;
};

export const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const normaliseCognitoUser = cu => ({
  given_name: getAttribute(cu, "given_name"),
  family_name: getAttribute(cu, "family_name"),
  email: getAttribute(cu, "email"),
  email_verified: getAttribute(cu, "email_verified"),
  phone_number: getAttribute(cu, "phone_number"),
  ...cu
  // Username: cu.Username,
  // isAdmin: cu.isAdmin,
  // isTopLevelAdmin: cu.isTopLevelAdmin,
  // Enabled: cu.Enabled,
  // UserStatus: cu.UserStatus,
});

export const normaliseCognitoUsers = (cUsers) => {
  if (!cUsers || cUsers.length === 0) return [];

  return cUsers.map(normaliseCognitoUser);
}
export const getUserById = (users, id) => {
  let user = users.find(u => u.Username === id);
  return user || {given_name: '', family_name: ''};
}

export const parseDate = (inputDate) => {
  try {
    let selected = null;
    try {
      selected = parseISO(inputDate);
    } catch (e) {
      // incompatible data had been saved, just ignore it
    }
    if (selected == "Invalid Date") selected = ""; // new Date();

    return selected;
  } catch {
    return "";
  }
};
function getAttribute(user, attributeName) {
  if (!user) return undefined;
  
  const attributeCollection = user.Attributes || user.UserAttributes;
  if (!attributeCollection) return undefined;

  const attribute = attributeCollection.find(
    (attr) => attr.Name === attributeName
  );
  if (attribute) {
    return attribute.Value;
  } else {
    return "";
  }
}
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
  return formattedDate === "Invalid Date" ? "" : formattedDate;
};