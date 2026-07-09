function ModelCheckbox({model, checked, onChange}) {
    return (
        <label
            className={[
                "flex items-start gap-3 p-3 rounded-lg border text-sm transition-all cursor-pointer",
                checked
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white hover:border-gray-300",
            ].join(" ")}
        >
            <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(model.value)}
                className="mt-0.5 w-4 h-4 accent-red-500 shrink-0"
            />
            <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900">{model.label}</div>
                <div className="text-gray-400 text-xs mt-0.5 truncate">{model.description}</div>
                {model.dependencies?.length > 0 && (
                    <div className="text-gray-300 text-xs mt-1 truncate">
                        dépend de : {model.dependencies.join(", ")}
                    </div>
                )}
                {model.endpoint && (
                    <span className="inline-flex mt-2 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {model.endpoint}
                    </span>
                )}
            </div>
        </label>
    );
}
export default ModelCheckbox;