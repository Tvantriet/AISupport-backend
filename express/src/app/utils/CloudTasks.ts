import { CloudTaskQueue } from "./CloudTasksQueue.js";

export default class CloudTasks {
	private static queueList: CloudTaskQueue[] = [];

	public static async addItem(url: string, payload: any, method: string, authHeader?: string) {
		// Init queueList if not done yet
		if (!this.queueList.length) this.initialize();

		const randomIndex = Math.floor(Math.random() * this.queueList.length);
		return await this.queueList[randomIndex].addItem(url, payload, method, authHeader);
	}

	private static initialize() {
		if (process.env.CLOUDTASK_QUEUE_ENABLED !== "1")
			throw new Error("CloudTask additem was called, but CLOUDTASK_QUEUE_ENABLED is not set");

		const gcpProjectId = process.env.CLOUDTASK_QUEUE_PROJECT;
		const gcpProjectKey = process.env.CLOUDTASK_QUEUE_KEYFILE; // note: optional, typically only local dev
		const baseQueueName = process.env.CLOUDTASK_QUEUE_BASENAME;
		const amountOfQueues = process.env.CLOUDTASK_QUEUES_AMOUNT
			? parseInt(process.env.CLOUDTASK_QUEUES_AMOUNT, 10)
			: 0;

		if (!gcpProjectId) throw new Error("CloudTask additem was called, but CLOUDTASK_QUEUE_PROJECT is not set");

		if (!baseQueueName) throw new Error("CloudTask additem was called, but CLOUDTASK_QUEUE_BASENAME is not set");

		if (!amountOfQueues || amountOfQueues < 0 || isNaN(amountOfQueues))
			throw new Error("CloudTask additem was called, but CLOUDTASK_QUEUES_AMOUNT is not set or NaN");

		// TODO: Figure out queue stuff
		// Queues are INACTIVE after 30 days of not being used... maybe make a new one each week or month?
		//  but then what about the queue limit? will INACTIVE ones be auto-deleted?
		//  figure this out!
		// const nowDate = DateTime.now();
		// ${nowDate.year}-${nowDate.weekNumber}

		this.queueList = [];
		for (let i = 0; i < amountOfQueues; i++)
			this.queueList.push(new CloudTaskQueue(`${baseQueueName}-${i}`, gcpProjectId, gcpProjectKey));
	}
}
