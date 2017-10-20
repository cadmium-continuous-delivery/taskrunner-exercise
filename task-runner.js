const process = require('child_process');

const runTask = async (suite) => {
 return new Promise((resolve, reject) => {
 	console.log('running ' + suite);

 	const task = process.spawn('node', ['simpletestrunner', suite]);

 	task.stdout.on('data', data => {
 		console.log('[-]> ' + data);
 	});

 	task.stderr.on('data', data => {
 		console.log('[~]> ' + data);
 	});

 	task.on('close', code => {
 		if (code == 0) {
 			resolve();
 		}
 		reject();
 	});
 });
}

runTask('testSuite1');