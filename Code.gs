var cc = DataStudioApp.createCommunityConnector();
/**
 * Returns the Auth Type of this connector.
 * @return {object} The Auth type.
 */
function getAuthType() {
  return cc.newAuthTypeResponse()
      .setAuthType(cc.AuthType.KEY)
      .setHelpUrl('https://www.contentful.com/developers/docs/references/authentication/')
      .build();
}

/**
 * Resets the auth service.
 */
function resetAuth() {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty('dscc.key');
}

/**
 * Returns true if the auth service has access.
 * @return {boolean} True if the auth service has access.
 */
function isAuthValid() {
  var userProperties = PropertiesService.getUserProperties();
  var key = userProperties.getProperty('dscc.key');
  // This assumes you have a validateKey function that can validate
  // if the key is valid.
  return validateKey(key);
}

/**
 * Sets the credentials.
 * @param {Request} request The set credentials request.
 * @return {object} An object with an errorCode.
 */
function setCredentials(request) {
  var key = request.key;

  // Optional
  // Check if the provided key is valid through a call to your service.
  // You would have to have a `checkForValidKey` function defined for
  // this to work.
  var validKey = checkForValidKey(key);
  if (!validKey) {
    return {
      errorCode: 'INVALID_CREDENTIALS'
    };
  }
  var userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('dscc.key', key);
  return {
    errorCode: 'NONE'
  };
}

/**
 * Returns true if the key is valid.
 * @param {Key} key The provided key.
 * @return {boolean} True if the key is valid.
 */
function checkForValidKey(key) {
  var key = key;

  // Need to implement this function. How best to validate a key?
  // Return true by default for now.
  return true;
}

/**
 * Gets the configuration details from user.
 */
function getConfig() {
  var config = cc.getConfig();

  config
    .newTextInput()
    .setId('spaceId')
    .setName('Space ID');

  config
    .newTextInput()
    .setId('environmentId')
    .setName('Environment ID');

  var entries = config.newOptionBuilder()
  .setLabel("Entries")
  .setValue("entries");

  config
  .newSelectSingle()
  .setId('element')
  .setName('Element')
  .setHelpText('Select the element you want data for.')
  .addOption(entries);

  return config.build();
}

/**
 * Gets the field types and aggregation types.
 * @return {object} fields The defined fields.
 */

function getFields() {
  var fields = cc.getFields();
  var types = cc.FieldType;
  var aggregations = cc.AggregationType;

  fields
    .newDimension()
    .setId('metadata')
    .setName('Metadata')
    .setType(types.TEXT);

  fields
    .newDimension()
    .setId('sys')
    .setName('Sys')
    .setType(types.TEXT);

  fields
    .newMetric()
    .setId('fields')
    .setName('Fields')
    .setType(types.TEXT);

  return fields;
}

/**
 * Gets the schema of the request.
 */
function getSchema(request) {
  return {schema: getFields().build()};
}

// https://developers.google.com/datastudio/connector/reference#getdata
function getData(request) {
  request.configParams = validateConfig(request.configParams);

  var requestedFields = getFields().forIds(
    request.fields.map(function(field) {
      return field.name;
    })
  );

  try {
    var apiResponse = fetchDataFromApi(request);
  } catch (e) {
    cc.newUserError()
      .setDebugText('Error fetching data from API. Exception details: ' + e)
      .setText(
        'The connector has encountered an unrecoverable error. Please try again later, or file an issue if this error persists.'
      )
      .throwException();
  }

  return {
    schema: requestedFields.build(),
    rows: data
  };
}

/**
 * Gets response for UrlFetchApp.
 *
 * @param {Object} request Data request parameters.
 * @returns {string} Response text for UrlFetchApp.
 */
function fetchDataFromApi(request) {
  var url = [
    'https://cdn.contentful.com/spaces/',
    request.configParams.spaceId,
    '/environments/',
    request.configParams.environmentId,
    '/',
    request.configParams.element,
    '?',
    'access_token=',
    request.key
  ].join('');
  var response = UrlFetchApp.fetch(url);
  return response;
}
