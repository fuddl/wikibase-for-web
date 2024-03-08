export default ({ vars, manager }) => {
	vars.setAlias = browser.i18n.getMessage('wb_set_alias');
	for (const instance of vars.instances) {
		instance.buttonLabel = browser.i18n.getMessage('send_to_instance', [
			manager.instances[instance.instance].name,
		]);
	}
};
