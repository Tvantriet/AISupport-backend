import cpr from "cpr";
// Copy all the view templates
cpr("src/views", "dist/views", {deleteFirst: true, //Delete "to" before
	overwrite: true, //If the file exists, overwrite it
	confirm: true //After the copy, stat all the copied files to make sure they are there
}, function(err, files) {
	if(err){
		console.error(err);
	}
	console.info(`Copied ${files.length} views`);
	//err - The error if any (err.list might be available with an array of errors for more detailed information)
	//files - List of files that we copied
});