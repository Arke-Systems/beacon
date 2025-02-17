import type { SchemaField } from '#cli/cs/Types.js';
import getUi from '#cli/schema/lib/SchemaUi.js';

export default function replaceField(field: SchemaField): SchemaField {
	if (!('extension_uid' in field) && !('plugins' in field)) {
		return field;
	}

	const entries = new Map(Object.entries(field));
	const extension_uid = entries.get('extension_uid');
	const plugins = entries.get('plugins');
	const ui = getUi();

	if (typeof extension_uid === 'string') {
		const extension = ui.options.schema.extension.byUid.get(extension_uid);
		if (!extension) {
			ui.warn('Unknown extension, please provide mapping for', extension_uid);
		} else {
			entries.set('extension_uid', { $beacon: { extension } });
		}
	}

	if (Array.isArray(plugins)) {
		entries.set('plugins', replacePlugins(ui, plugins));
	}

	return {
		...Object.fromEntries(entries),
		data_type: field.data_type,
		uid: field.uid,
	};
}

function replacePlugins(ui: ReturnType<typeof getUi>, plugins: unknown[]) {
	return plugins.map((pluginUid) => {
		if (typeof pluginUid !== 'string') {
			ui.warn('Invalid json RTE plugin uid', pluginUid);
			return pluginUid;
		}

		const plugin = ui.options.schema.jsonRtePlugin.byUid.get(pluginUid);
		if (!plugin) {
			ui.warn('Unknown json RTE plugin, please provide mapping for', pluginUid);
			return pluginUid;
		}

		return { $beacon: { jsonRtePlugin: plugin } };
	});
}
