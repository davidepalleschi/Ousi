const messages = [
            { id: '1', role: 'assistant', parts: [{ type: 'text', text: 'Ciao! ...' }] }
];
const formattedMessages = messages.map((m) => ({
    role: m.role,
    content: m.parts ? m.parts.map((p) => p.text).join(" ") : "",
}));
console.log(formattedMessages);
