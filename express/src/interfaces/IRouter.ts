import { Router } from "express";

export interface IRoute {
	getRoutes: () => Router;
}
