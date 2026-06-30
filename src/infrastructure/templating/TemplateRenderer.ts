export class TemplateRenderer {
  render(template: string, values: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
      return values[key] ?? match;
    });
  }
}
