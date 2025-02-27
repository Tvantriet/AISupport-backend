import { CloudTasksClient } from "@google-cloud/tasks";
import Logger from "./Logger.js";

export class CloudTaskQueue {
	private readonly projectName: string;
	private readonly projectRegion: string;
	private readonly queueName: string;
	private readonly client: CloudTasksClient;

	constructor(queueName: string, gcpProjectId: string, keyFileName?: string) {
		this.projectName = gcpProjectId;
		this.projectRegion = "europe-west1";
		this.queueName = queueName;
		this.client = new CloudTasksClient({ projectId: this.projectName, keyFilename: keyFileName });
	}

	createQueue() {
		return this.client.createQueue({
			parent: this.client.locationPath(this.projectName, this.projectRegion), // The fully qualified path to the location where the queue is created
			queue: {
				name: this.getQueuePath(), // The fully qualified path to the queue
				retryConfig: {
					maxAttempts: 4,
					minBackoff: { seconds: 60 },
					maxBackoff: { seconds: 600 },
				},
				rateLimits: {
					maxBurstSize: 100,
					maxConcurrentDispatches: 1000,
					maxDispatchesPerSecond: 500,
				},
			},
		});
	}

	async addItem(url: string, payload: any, method = "POST", authHeader?: string) {
		try {
			await this.createTask(url, payload, method, authHeader);
		} catch (e: any) {
			Logger.debug(`CloudTask caught (and will attempt handle) exception: '${e?.message}'`);

			if (e.code !== 9) {
				throw e;
			}

			// Code 9 = FAILED_PRECONDITION: Queue does not exist
			try {
				await this.createQueue();
			} catch (e2: any) {
				Logger.debug(`CloudTask caught 2nd (and will attempt handle) exception: '${e2?.message}'`);

				// Code 6 = ALREADY_EXISTS: Queue already exists
				if (e2.code !== 6) {
					throw e;
				}
			}

			// Send create task request.
			await this.createTask(url, payload, method, authHeader);
		}

		// Return name of queue for logging or w/e
		return this.queueName;
	}

	private createTask(url: string, payload: any, method: string, authHeader?: string) {
		if (method !== "POST" && method !== "PUT") throw new Error("CloudTasks: Only POST and PUT are supported");

		return this.client.createTask({
			parent: this.getQueuePath(),
			task: {
				dispatchDeadline: { seconds: 600 },
				httpRequest: {
					httpMethod: method,
					url,
					body: Buffer.from(JSON.stringify(payload)).toString("base64"),
					headers: {
						"Content-Type": "application/json",
						...(authHeader ? { Authorization: authHeader } : {}),
					},
				},
			},
		});
	}

	private getQueuePath() {
		return this.client.queuePath(this.projectName, this.projectRegion, this.queueName);
	}
}
