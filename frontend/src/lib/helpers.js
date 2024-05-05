import { parseISO } from "date-fns";
import systemTemplateConfig from '../components/systemTemplates/systemTemplateConfig'; 

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
  if (!Array.isArray(cUsers)) {
    return [];
  }

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
export const dateFromEpoch = (value) => {
  try {
    const ret = new Date(value);
    return (ret == "Invalid Date") ? undefined : ret;
  } catch {
    return undefined;
  }
}
export const dateToEpoch = (date) => date ? date.getTime() : undefined;

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


export const templateEmployeeField = (template) => {
  if (!template || !template.sections) return null;

  for (const section of template.sections) {
    if (!section.fields) return null;
    for (const field of section.fields) {
      if (field.type === 'employee') {
        return field.name; // Found an "employee" type field
      }
    }
  }
  return null; // No "employee" type field found
}


export const generateRandomPassword = () => {
  const specialChars = "!@#$%^&*()_+{}[]|:;<>,.?/";
  const digits = "0123456789";
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // Choose a random special character
  const specialChar =
    specialChars[Math.floor(Math.random() * specialChars.length)];

  // Choose a random digit
  const digit = digits[Math.floor(Math.random() * digits.length)];

  // Generate the remaining characters (6 characters) with letters
  let remainingChars = "";
  for (let i = 0; i < 6; i++) {
    remainingChars += letters[Math.floor(Math.random() * letters.length)];
  }

  // Combine all the parts and shuffle them
  const password = specialChar + digit + remainingChars;
  const shuffledPassword = password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return shuffledPassword;
};

export const isSystemTemplate = (templateId) => templateId && templateId.startsWith("SYS_");
export const loadSystemTemplate = (templateId) => {
  // Extract the system template from systemTemplateConfig
  const systemTemplate = systemTemplateConfig.systemTemplates.find(
    (template) => template.templateId === templateId
  );
  if (systemTemplate) {
    // Return the system template
    return systemTemplate;
  } else {
    throw new Error(`System template with ID ${templateId} not found`);
  }
};