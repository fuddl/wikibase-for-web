import { h, Component } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';

const html = htm.bind(h);

import Type from './Type.mjs';

class Appoint extends Component {
	handleChange = e => {
		const { onValueChange } = this.props;
		if (onValueChange) {
			onValueChange({
				name: e.target.name !== '' ? e.target.name : e.target.dataset.proxyName,
				value: e.target.value,
			});
		}
	};

	componentDidMount() {
		requireStylesheet(browser.runtime.getURL('/components/appoint.css'));
	}

	render() {
		const { name, datavalue, manager, onValueChange } = this.props;
		return html`
			<div class="appoint">
				<input
					name="${name}.datavalue.value.after"
					data-type="int"
					type="hidden"
					value=${datavalue.value.after ?? 0} />
				<input
					name="${name}.datavalue.value.before"
					data-type="int"
					type="hidden"
					value=${datavalue.value.before ?? 0} />
				<input
					name="${name}.datavalue.value.calendarmodel"
					type="hidden"
					value=${manager.urlFromIdNonSecure(datavalue.value.calendarmodel)} />
				<input
					name="${name}.datavalue.value.precision"
					data-type="int"
					type="hidden"
					value=${datavalue.value.precision} />
				<input
					name="${name}.datavalue.value.time"
					type="hidden"
					value=${datavalue.value.time} />
				<input
					name="${name}.datavalue.value.timezone"
					type="hidden"
					data-type="int"
					value=${datavalue.value.timezone} />
				<input
					name="${name}.datavalue.value.time"
					type="hidden"
					value=${datavalue.value.time} />
				<${Type}
					value=${datavalue.value.time
						? datavalue.value.time.match(/^([-\+]\d{4}-\d{2}-\d{2})/)[1]
						: ''}
					proxyName="${name}.datavalue.value.time"
					pattern=${'^[\\-+]\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'}
					required=${true}
					onValueChange=${newValue => {
						if (newValue.value === '') {
							return;
						}
						newValue.value = `${newValue.value}T00:00:00Z`;
						onValueChange(newValue);
					}} />
				<input
					class="appoint__picker"
					type="date"
					value=${datavalue.value.time
						? datavalue.value.time.match(/^[-\+](\d{4}-\d{2}-\d{2})/)[1]
						: ''}
					proxyName="${name}.datavalue.value.time"
					onChange=${e => {
						if (e.target.value) {
							onValueChange({
								name: `${name}.datavalue.value.time`,
								value: `+${e.target.value}T00:00:00Z`,
							});
						}
					}} />
			</div>
		`;
	}
}

export default Appoint;
