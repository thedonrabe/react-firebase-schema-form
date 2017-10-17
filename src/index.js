import React, { Component } from "react";
import PropTypes from "prop-types";

export default class DBFormTool extends Component {
  constructor(props) {
    super(props);

    // front load binding for clarity in code
    this.schemaDisplay = this.schemaDisplay.bind(this);
    this.formBuilder = this.formBuilder.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.getNestingString = this.getNestingString.bind(this);
    this.recursiveNestingString = this.recursiveNestingString.bind(this);
    this.propertyByString = this.propertyByString.bind(this);
    this.checkValidation = this.checkValidation.bind(this);
    this.fieldLabelCleanup = this.fieldLabelCleanup.bind(this);
    this.cleanObjectProperties = this.cleanObjectProperties.bind(this);
    this.fieldTagCleanup = this.fieldTagCleanup.bind(this);
  }

  cleanObjectProperties(inSchema) {
    // temp obj to house clean properties
    var obj = {};

    // go through each property in schema object
    for (var item in inSchema) {
      // if the property is a nested object
      if (typeof inSchema[item] === "object") {
        // if there in at least on keyed (named) property // probably not needed
        // clean up the field label and set key equal to recursive return
        if (Object.keys(inSchema[item]).length !== 0)
          obj[this.fieldTagCleanup(item)] = this.cleanObjectProperties(
            inSchema[item]
          );
        // if it is not a nested object set position values in temp obj
      } else {
        obj[this.fieldTagCleanup(item)] = inSchema[item];
      }
    }

    // return field and label cleaned object
    return obj;
  }

  schemaDisplay(inSchema) {
    // get array of object properties
    var schemaArray = Object.getOwnPropertyNames(inSchema);

    schemaArray = schemaArray.map(item => {
      // check to see if the item in the array is an object
      if (inSchema[item] instanceof Object) {
        // if it is send object in for another pass and return the array
        // with the first item being the object title when exit condition
        // has been met
        return [item, ...this.schemaDisplay(inSchema[item])];
      } else {
        // if it is NOT a object return item
        return item;
      }
    });

    // return this iteration's array
    return schemaArray;
  }

  // given array from object build db form for input
  formBuilder(inArr) {
    console.log(inArr);
    return (
      <ul className="dbtool-unorderedList">
        {inArr.map(item => {
          // is this a jagged array
          if (Array.isArray(item)) {
            // NESTED LIST //
            // is an array so send back through and create a new list headed by this item
            return (
              <div>
                <li
                  className="dbtool-nestedHeader"
                  {...this.checkValidation(item[0])}
                >
                  <strong> {this.fieldLabelCleanup(item[0])} </strong>
                </li>
                {this.formBuilder(item.slice(1))}
              </div>
            );
          } else {
            // return list item with input field
            return (
              <li
                className="dbtool-listItemWithInput"
                {...this.checkValidation(item)}
              >
                <strong> {this.fieldLabelCleanup(item)}: </strong>
                <input
                  className="dbtool-input"
                  onChange={this.onChange}
                  {...this.checkValidation(item)}
                />
              </li>
            );
          }
        })}
      </ul>
    );
  }

  // handle changes to input fields and save to local state
  onChange(event) {
    // gets the object property dynamically to allow for nested
    // objects and thier properties... the property by string will set
    // the local state to the new value... the get nested string will
    // parse out the dot notation as a string.
    // **** see function declaration for further info
    this.propertyByString(
      this.props.inSchema,
      this.getNestingString(event.target.id),
      event.target.value
    );
  }

  onSubmit(event) {
    event.preventDefault();

    // create temp variable with cleaned properties
    // cleanObjectProperties removes any "_" values we use
    // for validation
    var tempObj = this.cleanObjectProperties(this.props.inSchema);

    // if an auth user should be created in the Auth database
    if (this.props.createUser) {
      // normalize the email data for the login and db calls
      tempObj.email = tempObj.email.toLowerCase();

      // create Auth user
      this.props.firebaseObj
        .auth()
        .createUserWithEmailAndPassword(tempObj.email, tempObj.password)
        .then(response => {
          // if you would like to do something with the user object returned
        });
    }

    // clear out password data and set time stamp for the full db push
    this.setState({
      password: "",
      createdAt: Date()
    });

    // delete password information from temp object so it doesn't get passed to
    // db with rest of data
    if (tempObj.password) delete tempObj.password;

    // set temp object date/time stamp
    tempObj.createdAt = Date();

    // push temp object to db
    this.props.firebaseObj
      .database()
      .ref(`/${this.props.branch}/`)
      .push(tempObj)
      .then(payload => {
        // set the key value to the return
        this.setState({
          key: payload.key
        });

        // if this is a user
        if (this.props.createUser) {
          // create in the passed in branch
          this.props.firebaseObj
            .database()
            .ref(`/${this.props.branch}/${payload.key}/userRights_key`)
            .once("value")
            .then(snapshot => {
              // attach user rights
              this.props.firebaseObj
                .database()
                .ref(`/userRights/${snapshot.val()}`)
                .once("value")
                .then(snapshot => {
                  // if teacher put reference in active teachers branch
                  if (snapshot.val().name === "teacher") {
                    this.props.firebaseObj
                      .database()
                      .ref(`/activeTeachers/${this.state.key}`)
                      .set("keyRef");
                  }
                  // if parent put reference in active parents branch
                  if (snapshot.val().name === "parent") {
                    this.props.firebaseObj
                      .database()
                      .ref(`/activeParents/${this.state.key}`)
                      .set("keyRef");
                  }
                });
            });
        } else {
          // create the item in the db
          this.props.firebaseObj
            .database()
            .ref(`/${this.props.branch}/`)
            .push(tempObj)
            .then(payload => {
              // do something if needed with payload
            });
        }
      });

    // reset the form
    event.target.reset();

    // shut modal
    if (this.props.modalShutFunct) {
      this.props.modalShutFunct();
    }
  }

  getNestingString(inProp) {
    // get object array
    var tempArray = this.schemaDisplay(this.props.inSchema);

    // create return string variable
    var returnStr = "";

    // go through schema and find position
    for (var i = 0; i < tempArray.length; i++) {
      // if this array position contains an array
      if (Array.isArray(tempArray[i])) {
        // set temp str to return of recursive function
        var tempStr = this.recursiveNestingString(tempArray[i], inProp);

        // if it has been found we should have a valid string, so set return to that
        if (tempStr.length > 0) returnStr = `${tempArray[i][0]}.${tempStr}`;
      } else {
        // not nested so create return value
        if (tempArray[i] === inProp) returnStr = `${tempArray[i]}`;
      }
    }

    // return built string
    return returnStr;
  }

  // if array position is found to have an array (nested) recursively follow
  // and build out string to get dot notation for object property we are searching for...
  // * for in depth explaination see the non recursive version of this function
  recursiveNestingString(inArray, inProp) {
    // keep looking for additional nesting
    for (var i = 0; i < inArray.length; i++) {
      if (Array.isArray(inArray[i])) {
        var tempStr = this.recursiveNestingString(inArray[i], inProp);
        if (tempStr.length > 0) {
          return `${inArray[i][0]}.${tempStr}`;
        }
      } else if (inArray[i] === inProp) {
        return `${inArray[i]}`;
      }
    }

    // found nothing
    return "";
  }

  // create the object path using [] notation, given the
  // found dot notation and set that property to passed in value
  propertyByString(obj, path, value) {
    // if this is a valid string split the string up by the '.' notation separator
    if (typeof path === "string") {
      path = path.split(".");
    }

    // recursively got through until the final path in the '.' notation
    // has been reached and set the value to what was passed in
    if (path.length > 1) {
      this.propertyByString(obj[path.shift()], path, value);
    } else {
      obj[path[0]] = value;
    }
  }

  // builds a style object based on attached validation options
  checkValidation(inString) {
    var returnObj = {};
    // if this field has the REQUIRED tag
    if (inString.slice(-2) === "_r") {
      returnObj.required = "true";
      switch (inString.slice(-4, -2)) {
        // EMAIL
        case "_e":
          returnObj.type = "email";
          returnObj.id = inString;
          break;
        default:
          // is required but there is no type validation
          returnObj.id = inString;
          break;
      }
    } else {
      // this is if we have validation but the field is not required
      switch (inString.slice(-2)) {
        // EMAIL
        case "_e":
          returnObj.type = "email";
          returnObj.id = inString;
          break;
        // IGNORE -- this field should not be seen on form
        case "_i":
          returnObj.style = { display: "none" };
          break;
        default:
          // not required and no type validation
          returnObj.id = inString;
          break;
      }
    }

    // set placeholder based on id
    if (returnObj.id) {
      returnObj.placeholder = `Enter ${this.fieldLabelCleanup(returnObj.id)}`;
    }
    // return the Style object
    return returnObj;
  }

  fieldTagCleanup(inString) {
    // TODO: for now this is checking to see if there is _% and removing
    if (inString.slice(-2) === "_r") inString = inString.slice(0, -2);
    if (inString.slice(-2, -1) === "_") inString = inString.slice(0, -2);
    return inString;
  }

  fieldLabelCleanup(inString) {
    var cleanLabel;

    inString = this.fieldTagCleanup(inString);

    /////////////////////////////////////////////////////////////////////
    // use this for variable names separated by "_"
    /////////////////////////////////////////////////////////////////////

    // check to see if there are _ left and replace with space
    //inString = inString.split("_").join(" ");

    /////////////////////////////////////////////////////////////////////
    // camel case string clean up
    /////////////////////////////////////////////////////////////////////
    cleanLabel = inString;
    cleanLabel = cleanLabel.split("");
    cleanLabel[0] = cleanLabel[0].toUpperCase();

    // keep track of previous letter to find changes in case
    var returnStringArray = [];
    var previousLetter = "";
    cleanLabel.map(letter => {
      if (letter === letter.toLowerCase()) {
        previousLetter = letter;
        returnStringArray.push(letter);
      }
      if (letter === letter.toUpperCase() && previousLetter !== "") {
        returnStringArray.push(" ");
        returnStringArray.push(letter);
      } else if (previousLetter === "") {
        returnStringArray.push(letter);
      }
      return null;
    });
    /////////////////
    // for _ cleanup
    //////////////////
    // return inString;

    /////////////////
    // for camel case cleanup
    //////////////////////
    returnStringArray = returnStringArray.join("");

    return returnStringArray;
  }

  // currently uses w3.CSS styling
  render() {
    return (
      <div>
        <h1> {this.props.title} </h1>
        <form onSubmit={this.onSubmit}>
          {this.formBuilder(this.schemaDisplay(this.props.inSchema))}

          <footer className="dbtool-footer">
            <button className="dbtool-button" type="submit">
              SAVE
            </button>
          </footer>
        </form>
      </div>
    );
  }
}

// prop-type definition
DBTool.PropTypes = {
  branch: PropTypes.string.isRequired,
  inSchema: PropTypes.object.isRequired,
  createUser: PropTypes.bool,
  modalShutFunct: PropTypes.func
};
