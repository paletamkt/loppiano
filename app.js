// ===============================
// INSIGHTS GERAIS
// ===============================

function renderInsightsGerais() {
  if (!$('insights-gerais-resumo')) return

  renderInsightsGeraisResumo()
  renderInsightsGeraisAlertas()
  renderInsightsGeraisProdutos()
  renderInsightsGeraisOperacao()
}

function renderInsightsGeraisResumo() {
  const box = $('insights-gerais-resumo')
  const resumo = DATA.resumo_mensal || []

  if (!box || !resumo.length) return

  const ordenado = [...resumo].sort((a, b) => periodoParaOrdem(a.periodo) - periodoParaOrdem(b.periodo))
  const ultimo = ordenado[ordenado.length - 1]
  const anterior = ordenado[ordenado.length - 2]

  const maiorMes = [...ordenado]
    .sort((a, b) => Number(b.fat_real_total || 0) - Number(a.fat_real_total || 0))[0]

  let crescimentoHtml = ''

  if (anterior) {
    const atualFat = Number(ultimo.fat_real_total || 0)
    const anteriorFat = Number(anterior.fat_real_total || 0)

    const crescimento = anteriorFat
      ? ((atualFat - anteriorFat) / anteriorFat) * 100
      : 0

    crescimentoHtml = `
      <div class="insight-item">
        ${crescimento >= 0 ? '📈' : '📉'}
        Último período (${ultimo.periodo}) teve variação de
        <strong>${crescimento.toFixed(1)}%</strong>
        vs ${anterior.periodo}.
      </div>
    `
  }

  box.innerHTML = `
    <div class="insight-item">
      🏆 Melhor período:
      <strong>${maiorMes.periodo}</strong>
      com <strong>${fmtBRL(maiorMes.fat_real_total)}</strong>.
    </div>

    <div class="insight-item">
      📍 Último período carregado:
      <strong>${ultimo.periodo}</strong>
      com <strong>${fmtBRL(ultimo.fat_real_total)}</strong>.
    </div>

    ${crescimentoHtml}
  `
}

function renderInsightsGeraisAlertas() {
  const box = $('insights-gerais-alertas')
  const resumo = DATA.resumo_mensal || []

  if (!box || !resumo.length) return

  const ultimo = [...resumo]
    .sort((a, b) => periodoParaOrdem(a.periodo) - periodoParaOrdem(b.periodo))
    .at(-1)

  const meta = Number(ultimo.meta_total || 0)
  const real = Number(ultimo.fat_real_total || 0)
  const pctMeta = meta ? (real / meta) * 100 : 0

  let alertas = ''

  if (pctMeta < 80) {
    alertas += `
      <div class="insight-item">
        🚨 Meta em risco: último período está em
        <strong>${pctMeta.toFixed(1)}%</strong>
        da meta.
      </div>
    `
  } else if (pctMeta < 100) {
    alertas += `
      <div class="insight-item">
        ⚠️ Meta ainda não batida: último período está em
        <strong>${pctMeta.toFixed(1)}%</strong>.
      </div>
    `
  }

  const vendas = DATA.vendas_diarias || []
  if (vendas.length >= 7) {
    const ordenadas = [...vendas].sort((a, b) => new Date(a.data) - new Date(b.data))
    const ultimos7 = ordenadas.slice(-7)
    const media7 = ultimos7.reduce((acc, v) => acc + Number(v.fat_real || 0), 0) / ultimos7.length

    const anteriores7 = ordenadas.slice(-14, -7)
    if (anteriores7.length) {
      const mediaAnterior7 = anteriores7.reduce((acc, v) => acc + Number(v.fat_real || 0), 0) / anteriores7.length
      const variacao = mediaAnterior7 ? ((media7 - mediaAnterior7) / mediaAnterior7) * 100 : 0

      if (variacao < -10) {
        alertas += `
          <div class="insight-item">
            ⚠️ Média dos últimos 7 dias caiu
            <strong>${Math.abs(variacao).toFixed(1)}%</strong>
            vs 7 dias anteriores.
          </div>
        `
      }
    }
  }

  if (!alertas) {
    alertas = `
      <div class="insight-item">
        ✅ Nenhum alerta geral crítico identificado.
      </div>
    `
  }

  box.innerHTML = alertas
}

function renderInsightsGeraisProdutos() {
  const box = $('insights-gerais-produtos')
  const produtos = DATA.produtos || []

  if (!box || !produtos.length) return

  const agrupado = {}

  produtos.forEach(p => {
    const nome = p.produto || 'Sem produto'

    if (!agrupado[nome]) {
      agrupado[nome] = {
        produto: nome,
        quantidade: 0,
        valor_total: 0
      }
    }

    agrupado[nome].quantidade += Number(p.quantidade || 0)
    agrupado[nome].valor_total += Number(p.valor_total || 0)
  })

  const ranking = Object.values(agrupado)
    .sort((a, b) => b.valor_total - a.valor_total)

  const topFat = ranking[0]
  const topQtd = [...ranking].sort((a, b) => b.quantidade - a.quantidade)[0]

  box.innerHTML = `
    <div class="insight-item">
      🍕 Produto com maior faturamento:
      <strong>${topFat.produto}</strong>
      com <strong>${fmtBRL(topFat.valor_total)}</strong>.
    </div>

    <div class="insight-item">
      📦 Produto mais vendido em quantidade:
      <strong>${topQtd.produto}</strong>
      com <strong>${fmtNum(topQtd.quantidade)}</strong> unidades.
    </div>
  `
}

function renderInsightsGeraisOperacao() {
  const box = $('insights-gerais-operacao')
  const garcons = removerPlataformasGarcons(DATA.garcons || [])
  const horarios = DATA.horarios || []

  if (!box) return

  let html = ''

  if (garcons.length) {
    const agrupado = {}

    garcons.forEach(g => {
      const nome = g.atendente || 'Sem nome'

      if (!agrupado[nome]) {
        agrupado[nome] = {
          atendente: nome,
          fat: 0,
          qtd: 0
        }
      }

      agrupado[nome].fat += Number(g.fat_real || 0)
      agrupado[nome].qtd += Number(g.quantidade || 0)
    })

    const ranking = Object.values(agrupado)
      .sort((a, b) => b.fat - a.fat)

    const top = ranking[0]

    html += `
      <div class="insight-item">
        👤 Atendente líder:
        <strong>${top.atendente}</strong>
        com <strong>${fmtBRL(top.fat)}</strong>.
      </div>
    `
  }

  if (horarios.length) {
    const agrupadoHora = {}

    horarios.forEach(h => {
      const hora = h.hora

      if (!agrupadoHora[hora]) {
        agrupadoHora[hora] = {
          hora,
          fat: 0,
          pessoas: 0
        }
      }

      agrupadoHora[hora].fat += Number(h.fat_real || 0)
      agrupadoHora[hora].pessoas += Number(h.pessoas || 0)
    })

    const topHora = Object.values(agrupadoHora)
      .sort((a, b) => b.fat - a.fat)[0]

    html += `
      <div class="insight-item">
        🕐 Horário mais forte:
        <strong>${topHora.hora}h</strong>
        com <strong>${fmtBRL(topHora.fat)}</strong>.
      </div>
    `
  }

  if (!html) {
    html = `
      <div class="insight-item">
        Sem dados operacionais suficientes.
      </div>
    `
  }

  box.innerHTML = html
}
