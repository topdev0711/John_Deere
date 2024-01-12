function formatValidationErrors(errors) {
  try {
    if(errors.details){
      const formattedError = ('<ol>' + JSON.stringify(
        errors.details.map((d,i) => {
          const name = !!d.name ? d.name + ' ' : '';
          const message = d.message.replace(/<[\w\/]+>/g, '').replace(/\"/g, "'").trim();
          return `<li key={${i}}>${name}${message}</li>`
        }
        )
      ) + '</ol>').replace('["', '').replace('"]', '').replace(/\",\"/g, '');

      return formattedError;
    }
    return errors.message
  } catch(e) {
    return JSON.stringify(errors);
  }
}

module.exports = {
  formatValidationErrors
};