export type DialogItemValueChecker<Value> =
	| ((value: Value) => { type: string; message: string })
	| undefined

export type CollectionItem = { icon?: string; name: string; value: string }

export { default as BaseDialogItem } from './baseDialogItem.svelte'
export { default as Checkbox } from './checkbox.svelte'
export { default as CodeInput } from './codeInput.svelte'
export { default as Collection } from './collection.svelte'
export { default as ColorPicker } from './colorPicker.svelte'
export { default as FileSelect } from './fileSelect.svelte'
export { default as FolderSelect } from './folderSelect.svelte'
export { default as LineInput } from './lineInput.svelte'
export { default as NumberSlider } from './numberSlider.svelte'
export { default as SectionHeader } from './sectionHeader.svelte'
export { default as Select } from './select.svelte'
export { default as Vector2d } from './vector2d.svelte'
export { default as Vector3d } from './vector3d.svelte'
