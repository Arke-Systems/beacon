const fileUploadInit = {
	bodySerializer(body: Record<string, string>) {
		const fd = new FormData();

		for (const [name, value] of Object.entries(body)) {
			fd.append(
				name,
				new Blob([value], {
					endings: 'transparent',
					type: 'application/json',
				}),
			);
		}

		return fd;
	},
};

export default fileUploadInit;
