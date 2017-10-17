# react-firebase-schema-form
A tool to create a simple form (that can be styled) to allow for schema object basic validation and data entry into a Firebase database (with auth user creation optional)


# Overview

This database tool can be used strictly for entering data into your Firebase database or can be used for client side forms with a little bit of extra styling.

## use:

Install react-firebase-schema-form npm module:

```
$ npm init
$ npm install react-firebase-schema-form
```

## To use in your code:

ES6 -
```javascript
import {DBFormTool} from 'react-firebase-schema-form';
```

### To use form first create a schema to use:

```javascript
export const exampleUser = {
  firstName_r: "",
  lastName_r: "",
  email_e_r: "",
  password_r: "",
  phoneNumber: "",
  bio: {
    gradeLevel_r: "",
    hours: "",
    text: ""
  },
  children_i: {},
  activeChats_i: {},
  inactiveChats_i: {},
  activeMessages_i: {},
  inactiveMessages_i: {},
  createdAt_i: "",
  askAgain_i: "true",
  userRights_key_i: "****************"
};
```

#### If you notice you have some validation options. Use the following to provide basic html validation to fields:

..* '_e' will check for a valid email
..* '_i' will ignore this field in the form, but still allow for information to be included in the database push
..* '_r' will require this field to be entered when filling out the form. 

* The current method of this tool requires that the '_r' be the last validation item in a chain, but you can chain them along for example look at the email property in the schema object.

```javascript
email_e_r: "",
```

this will both verify it is an email as well as require the field to be entered.

### Next, we can now use the tool

We can call our component using the tag

```javascript
<DBTool
     branch="users/examplebranch"
     inSchema={exampleUser}
     createUser= true
     modalShutFunct={() => this.toggleModal()}
     title="Enter User Information"
     firebaseObj=firebase
/>
```

the modal shut function is not required to be passed in, but we use this client side with some styling and have this form render in a modal. If you would like to incorporate it that way I have left the functionality intact.

..* branch - this is the branch of the Firebase database you would like the new data pushed to
..* inSchema - this is the schema that we created earlier called "exampleUser"
..* createUser - a bool passed in to let the tool know if you want an authentication user created along with the push to the database. This will only create an authentication user by email and password.
..* modalShutFunct - function to shut the modal or other display showing form.
..* title - the title for the form to show
..* firebaseObj - this is a authorized firebase object... You must have the firebase npm package installed and authorized, then pass that authorized object into the tool for the database pushes. For further information on this please see the [firebase npm package](https://www.npmjs.com/package/firebase)

## Styling

I have included className tags in the JSX elements for styling purposes if you would like to style the form.

dbtool-unorderedList - the unordered list.
dbtool-nestedHeader - any nested object headers -- in the example 'bio' would use this className.
dbtool-listItemWithInput - the list item, or label for input fields
dbtool-input - input fields for data entry
dbtool-footer - any footer styling for the section containing the submit button
dbtool-button - submit button styling




