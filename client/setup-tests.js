process.on('unhandledRejection', function (error) {
  console.log(error, error.stack);
});