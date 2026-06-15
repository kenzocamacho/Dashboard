const Importer = (function () {
  const REQUIRED = ["id_entrega", "transportadora", "regiao", "prazo_dias", "dias_reais"];
  const NUMERIC = ["id_entrega", "prazo_dias", "dias_reais"];

  const ALIASES = {
    id_entrega:     ["id_entrega", "id", "entrega", "codigo", "cod", "numero", "num", "pedido"],
    transportadora: ["transportadora", "transp", "transportador", "carrier", "empresa", "operador"],
    regiao:         ["regiao", "region", "uf", "area", "praca", "local", "destino"],
    prazo_dias:     ["prazo_dias", "prazo", "sla", "prazocombinado", "prazoentrega", "prazos"],
    dias_reais:     ["dias_reais", "dias", "diasreal", "tempoentrega", "realizado", "diasgastos", "real"]
  };

  const norm = (s) => String(s).trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

  const LOOKUP = {};
  for (const field in ALIASES) {
    LOOKUP[norm(field)] = field;
    ALIASES[field].forEach((a) => { LOOKUP[norm(a)] = field; });
  }

  function mapHeaders(headers) {
    const map = {};
    headers.forEach((h) => {
      const canon = LOOKUP[norm(h)];
      if (canon && !(canon in map)) map[canon] = h;
    });
    return map;
  }

  function toNumber(v) {
    if (typeof v === "number") return v;
    return parseFloat(String(v).replace(",", ".").replace(/[^\d.\-]/g, ""));
  }

  function normalizeRows(rawRows) {
    if (!rawRows.length) throw new Error("O arquivo não contém linhas de dados.");

    const headers = Object.keys(rawRows[0]);
    const map = mapHeaders(headers);

    const faltando = REQUIRED.filter((f) => !(f in map));
    if (faltando.length) {
      throw new Error(
        "Colunas obrigatórias ausentes: " + faltando.join(", ") +
        ". O arquivo precisa conter: " + REQUIRED.join(", ") + "."
      );
    }

    return rawRows.map((row, i) => {
      const out = {};
      REQUIRED.forEach((f) => {
        let v = row[map[f]];
        if (NUMERIC.includes(f)) {
          v = toNumber(v);
          if (Number.isNaN(v)) {
            throw new Error(`Valor numérico inválido na linha ${i + 2}, coluna "${f}".`);
          }
        } else {
          v = String(v).trim();
          if (!v) throw new Error(`Valor vazio na linha ${i + 2}, coluna "${f}".`);
        }
        out[f] = v;
      });
      return out;
    });
  }

  function decodeText(buffer, encoding) {
    let text = new TextDecoder(encoding, { fatal: false }).decode(buffer);
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    return text;
  }

  function parseRows(text) {
    const wb = XLSX.read(text, { type: "string" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { defval: "" });
  }

  function parseFile(file) {
    return new Promise((resolve, reject) => {
      if (typeof XLSX === "undefined") {
        reject(new Error("Biblioteca de leitura de planilhas não foi carregada."));
        return;
      }

      const isText = /\.(csv|txt)$/i.test(file.name) ||
                     file.type === "text/csv" || file.type === "text/plain";

      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
      reader.onload = (e) => {
        try {
          if (isText) {
            const buffer = e.target.result;

            const encodings = ["utf-8", "windows-1252"];
            let lastErr;
            for (const enc of encodings) {
              try {
                resolve(normalizeRows(parseRows(decodeText(buffer, enc))));
                return;
              } catch (err) { lastErr = err; }
            }
            throw lastErr;
          } else {
            const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array", codepage: 65001 });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            resolve(normalizeRows(XLSX.utils.sheet_to_json(sheet, { defval: "" })));
          }
        } catch (err) {
          reject(err);
        }
      };

      reader.readAsArrayBuffer(file);
    });
  }

  return { parseFile, REQUIRED };
})();
