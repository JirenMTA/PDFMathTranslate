import html
import re
import unicodedata
import logging
from string import Template
from typing import cast
import requests
import openai
logger = logging.getLogger(__name__)

def remove_control_characters(s: str) -> str:
    return "".join(ch for ch in s if unicodedata.category(ch)[0] != "C")


class BaseTranslator:
    name = "base"
    lang_map: dict[str, str] = {}
    CustomPrompt = False

    def __init__(self, lang_in: str, lang_out: str, model: str):
        # Ánh xạ ngôn ngữ nếu cần
        self.lang_in = self.lang_map.get(lang_in.lower(), lang_in)
        self.lang_out = self.lang_map.get(lang_out.lower(), lang_out)
        self.model = model

    def translate(self, text: str) -> str:
        return self.do_translate(text)

    def do_translate(self, text: str) -> str:
        raise NotImplementedError

    def prompt(
        self, text: str, prompt_template: Template | None = None
    ) -> list[dict[str, str]]:
        try:
            return [
                {
                    "role": "user",
                    "content": cast(Template, prompt_template).safe_substitute(
                        {"lang_in": self.lang_in, "lang_out": self.lang_out, "text": text}
                    ),
                }
            ]
        except Exception:
            pass

        return [
            {
                "role": "user",
                "content": (
                    "You are a professional machine translation engine. "
                    "Only output the translated text.\n\n"
                    f"Translate the following text to {self.lang_out}. "
                    "Keep formula notation {v*} unchanged.\n\n"
                    f"Source Text: {text}\n\nTranslated Text:"
                ),
            }
        ]

    def __str__(self) -> str:
        return f"{self.name} {self.lang_in}->{self.lang_out} model={self.model}"

    def get_rich_text_left_placeholder(self, id: int) -> str:
        return f"<b{id}>"

    def get_rich_text_right_placeholder(self, id: int) -> str:
        return f"</b{id}>"

    def get_formular_placeholder(self, id: int) -> str:
        return self.get_rich_text_left_placeholder(id) + self.get_rich_text_right_placeholder(id)


class GoogleTranslator(BaseTranslator):
    name = "google"
    lang_map = {"zh": "zh-CN"}

    def __init__(self, lang_in: str, lang_out: str, model: str):
        super().__init__(lang_in, lang_out, model)
        self.session = requests.Session()
        self.endpoint = "https://translate.google.com/m"
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
            )
        }

    def do_translate(self, text: str) -> str:
        text = text[:5000]  # Google giới hạn 5000 ký tự

        response = self.session.get(
            self.endpoint,
            params={"sl": self.lang_in, "tl": self.lang_out, "q": text},
            headers=self.headers,
        )
        response.raise_for_status()
        parts = re.findall(r'class="(?:t0|result-container)">(.*?)<', response.text)
        result = html.unescape(parts[0]) if parts else ""
        return remove_control_characters(result)


class OpenAITranslator(BaseTranslator):
    name = "openai"

    def __init__(
        self,
        lang_in: str,
        lang_out: str
    ):
        envs = {
            "OPENAI_BASE_URL": "https://openrouter.ai/api/v1",
            "OPENAI_API_KEY": "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",
            "OPENAI_MODEL": "deepseek/deepseek-r1:free",
        }
        self.envs = envs
        self.model = self.envs["OPENAI_MODEL"]

        super().__init__(lang_in, lang_out, self.model)

        self.client = openai.OpenAI(
            base_url=self.envs["OPENAI_BASE_URL"],
            api_key=self.envs["OPENAI_API_KEY"],
        )
        default_prompt = Template(
            "You are a professional translator. The output length cannot be much larger than the input. "
            "Abbreviations in the input will be written as is and not translated in the output."
            "Translate the text below from "
            "${lang_in} to ${lang_out}. Do not change placeholders like {v1}.\n\n${text}"
        )
        self.prompt_tpl = default_prompt
        self.options = {"temperature": 0}
        self.think_filter = re.compile(r"^<think>.+?</think>\\s*", re.S)

    def prompt(self, text: str) -> list[dict]:
        return [
            {"role": "system", "content": self.prompt_tpl.safe_substitute(
                lang_in=self.lang_in, lang_out=self.lang_out, text=text)}
        ]


    def do_translate(self, text: str) -> str:
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=self.prompt(text),
        )

        content = resp.choices[0].message.content.strip()
        return self.think_filter.sub("", content)


if __name__ == "__main__":
    # trans = GoogleTranslator(
    #     lang_in='en',
    #     lang_out='vi',
    #     model='google'
    # )
    trans = OpenAITranslator(lang_in='en', lang_out='vi')
    text = "Hello, I'm Pham Ngoc Hung {v1}"
    out = trans.do_translate(text)
    print(out)
    print(trans.do_translate("hello"))


