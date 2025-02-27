import React from "react";
import { BasePropertyProps, CleanPropertyComponent } from "adminjs";

const ConditionalFieldShow: React.FC<BasePropertyProps> = (props) => {
	const { property, record } = props;
	const {
		props: { conditionalTypes },
	} = property;

	const questionType = record?.params.type as string;

	if (!conditionalTypes.includes(questionType)) {
		return <></>;
	}

	return <CleanPropertyComponent {...props} />;
};

export default ConditionalFieldShow;
