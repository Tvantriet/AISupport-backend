import React, { useEffect } from "react";
import { ApiClient } from "adminjs";
import { Box } from "@adminjs/design-system";
import DashboardHeader from "./components/dashboard-header.js";

export const Dashboard: React.FC = () => {
	// const { translateMessage } = useTranslation();
	const api = new ApiClient();

	useEffect(() => {
		api.getDashboard()
			.then((response) => {
				return response;
			})
			.catch((error) => {
				throw Error(error);
			});
	}, []);

	return (
		<Box>
			<DashboardHeader />
			<Box
				mt={["xl", "xl", "-100px"]}
				mb="xl"
				mx={[0, 0, 0, "auto"]}
				px={["default", "lg", "xxl", "0"]}
				position="relative"
				flex
				flexWrap="wrap"
				width={[1, 1, 1, 1024]}
			></Box>
		</Box>
	);
};

export default Dashboard;
