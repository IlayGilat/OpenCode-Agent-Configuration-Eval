export function renderTemplate(template, values) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return values[key] ?? match;
    });
}
