const Process = require('child_process');

const createTaskId = () => {
	return '' + Math.floor(Math.random() * 10000000) + 1;
}

const tasks = {};

const status = {
	pending: 'pending',
	running: 'running',
	completed: 'completed',
	error: 'error',
	cancelled: 'cancelled'
}

class Task {
	constructor() {
		this.time = { start: Date.now() };
		this.status = status.pending;
	}

	getRuntime() {
		return this.time.end ? this.time.end - this.time.start : Date.now - this.time.start;
	}
}

const runTask = (suite) => {
	const taskId = createTaskId();
	const task = tasks[taskId] = new Task();

 	const promise = new Promise((resolve, reject) => {

	 	const process = task.process = Process.spawn('node', ['simpletestrunner', suite]);
	 	task.status = status.running;

	 	var output = '';

	 	const parseOutput = output => {

	 		const results = { failures : [] };

		 	const regexes = {
		 		runResult: /Passed:\s+\d+(\sFailed:\s\d+)/i,
		 		failure: /Test ('.+?') failed with (.+?)\.(\s*[\r\n]*Reason:.*)?/gi
		 	};

	 		if (output.trim().match(regexes.runResult)) {
	 			const runResultMatch = output.trim().match(regexes.runResult);
	 			var passed = runResultMatch[0].trim().match(/Passed:\s+(\d+)/i)[1];
	 			var failed = runResultMatch[1] ? runResultMatch[1].trim().match(/Failed:\s+(\d+)/i)[1] : 0;
	 			console.log(`passed: ${passed}; failed: ${failed}`);
	 			results.passed = passed;
	 			results.failed = failed;
	 		}

	 		const failureMatches = output.trim().match(regexes.failure);
	 		if (failureMatches) {
	 			failureMatches.forEach(match => {
					const failureMatch = match.match(new RegExp(regexes.failure.source, 'i'));
					const failureReason = failureMatch[3] ? failureMatch[3].match(/Reason:(.*)/)[1].trim() : undefined;
		 			results.failures.push({ test: failureMatch[1], exception: failureMatch[2], reason: failureReason });	 	
	 			});		 			
	 		}
	 		
	 		return results;
	 	};

	 	process.stdout.on('data', data => {
	 		console.log(`[${taskId}]: ${data}`);
	 		output = output.concat(data);
	 	});

	 	process.stderr.on('data', data => {
	 		console.error(`[${taskId}-error]: ${data}`);
	 		output = output.concat(data);
	 	});

	 	process.on('close', code => {
	 		delete task.process;

	 		task.time.end = Date.now();

			task.result = parseOutput(output.toString());

	 		if (code == 0) {
	 			task.status = status.completed;
	 			resolve();
	 			return;
	 		} else {
	 			task.status = status.error;
	 			reject();		
	 		}
	 	});
	});

 	return { promise: promise, id: taskId };
}

/* =================================================== */

let taskHandle = runTask('testSuite2');
let task = tasks[taskHandle.id];
console.log('running task ' + taskHandle.id);
taskHandle.promise.then(result => {
	console.log('finished task: ' + JSON.stringify(task, null, '\t'));
}).catch(error => console.error('task failed: ' + JSON.stringify(task, null, '\t')))
.then(() => console.log(`runtime: ${task.getRuntime()} ms`));