class DismissedEditsAPI {
	constructor() {
		this.storageKey = 'dismissedEdits';
	}

	addDismissedEdit(signature) {
		let dismissedEdits = this.getDismissedEdits();
		if (!dismissedEdits.includes(signature)) {
			dismissedEdits.push(signature);
			localStorage.setItem(this.storageKey, JSON.stringify(dismissedEdits));
		}
	}

	getDismissedEdits() {
		const dismissedEdits = localStorage.getItem(this.storageKey);
		return dismissedEdits ? JSON.parse(dismissedEdits) : [];
	}

	isEditDismissed(signature) {
		const dismissedEdits = this.getDismissedEdits();
		return dismissedEdits.includes(signature);
	}

	removeDismissedEdit(signature) {
		let dismissedEdits = this.getDismissedEdits();
		const index = dismissedEdits.indexOf(signature);
		if (index > -1) {
			dismissedEdits.splice(index, 1);
			localStorage.setItem(this.storageKey, JSON.stringify(dismissedEdits));
		}
	}

	toggleDismissedEdit(signature, isDismissed) {
		if (isDismissed) {
			this.addDismissedEdit(signature);
		} else {
			this.removeDismissedEdit(signature);
		}
	}
}

export default DismissedEditsAPI;
