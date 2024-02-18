export default ({ vars, manager }) => {
	if (manager.navigator.canGoBack()) {
		vars.back = true
	}
}