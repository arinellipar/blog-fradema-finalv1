// src/components/tax-calculator.tsx

"use client";

import * as React from "react";
import { Calculator, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Tipos de regime tributário
 */
type TaxRegime = "simples" | "presumido" | "real";

/**
 * Tipos de empresa
 */
type CompanyType = "industria" | "comercio" | "servicos" | "tecnologia";

/**
 * Interface para dados de entrada
 */
interface TaxCalculatorInputs {
  monthlyRevenue: number;
  employeeCount: number;
  companyType: CompanyType;
  currentRegime: TaxRegime;
  hasInventory: boolean;
  hasExportImport: boolean;
  profitMargin: number;
}

/**
 * Interface para resultado de cálculo
 */
interface TaxCalculationResult {
  regime: TaxRegime;
  monthlyTax: number;
  annualTax: number;
  effectiveRate: number;
  details: {
    irpj: number;
    csll: number;
    pis: number;
    cofins: number;
    iss?: number;
    icms?: number;
    ipi?: number;
    simples?: number;
  };
  advantages: string[];
  disadvantages: string[];
  recommendation: boolean;
}

/**
 * Props do componente
 */
interface TaxCalculatorProps {
  className?: string;
  onCalculationComplete?: (results: TaxCalculationResult[]) => void;
}

/**
 * Hook para cálculos tributários
 */
function useTaxCalculations() {
  const calculateSimples = React.useCallback(
    (inputs: TaxCalculatorInputs): TaxCalculationResult => {
      const annualRevenue = inputs.monthlyRevenue * 12;

      // Tabela Simples Nacional - simplificada
      let rate = 0;
      if (annualRevenue <= 180000) rate = 0.04; // 4%
      else if (annualRevenue <= 360000) rate = 0.073; // 7.3%
      else if (annualRevenue <= 720000) rate = 0.095; // 9.5%
      else if (annualRevenue <= 1800000) rate = 0.107; // 10.7%
      else if (annualRevenue <= 3600000) rate = 0.143; // 14.3%
      else if (annualRevenue <= 4800000) rate = 0.19; // 19%
      else rate = 0.25; // Não pode ser Simples

      const monthlyTax = inputs.monthlyRevenue * rate;
      const annualTax = annualRevenue * rate;

      return {
        regime: "simples",
        monthlyTax,
        annualTax,
        effectiveRate: rate * 100,
        details: {
          irpj: 0,
          csll: 0,
          pis: 0,
          cofins: 0,
          simples: monthlyTax,
        },
        advantages: [
          "Simplicidade na apuração",
          "Unificação de tributos",
          "Redução da carga tributária",
          "Menos obrigações acessórias",
        ],
        disadvantages: [
          "Limite de faturamento",
          "Restrições para alguns setores",
          "Não permite dedução de despesas",
          "Dificuldade para abertura de filiais",
        ],
        recommendation: annualRevenue <= 4800000 && rate < 0.2,
      };
    },
    []
  );

  const calculatePresumido = React.useCallback(
    (inputs: TaxCalculatorInputs): TaxCalculationResult => {
      const monthlyRevenue = inputs.monthlyRevenue;

      // Percentuais de presunção baseados no tipo de empresa
      const presumptionRates = {
        industria: 0.08,
        comercio: 0.08,
        servicos: 0.32,
        tecnologia: 0.32,
      };

      const presumptionRate = presumptionRates[inputs.companyType];
      const presumedProfit = monthlyRevenue * presumptionRate;

      // Cálculo dos impostos
      const irpj = presumedProfit * 0.15; // 15% sobre lucro presumido
      const csll = presumedProfit * 0.09; // 9% sobre lucro presumido
      const pis = monthlyRevenue * 0.0065; // 0.65% sobre receita bruta
      const cofins = monthlyRevenue * 0.03; // 3% sobre receita bruta

      // ISS ou ICMS dependendo do tipo
      let iss = 0;
      let icms = 0;
      if (
        inputs.companyType === "servicos" ||
        inputs.companyType === "tecnologia"
      ) {
        iss = monthlyRevenue * 0.05; // 5% ISS (média)
      } else {
        icms = monthlyRevenue * 0.18; // 18% ICMS (média)
      }

      const monthlyTax = irpj + csll + pis + cofins + iss + icms;
      const annualTax = monthlyTax * 12;
      const effectiveRate = (monthlyTax / monthlyRevenue) * 100;

      return {
        regime: "presumido",
        monthlyTax,
        annualTax,
        effectiveRate,
        details: {
          irpj,
          csll,
          pis,
          cofins,
          iss: iss || undefined,
          icms: icms || undefined,
        },
        advantages: [
          "Cálculo baseado em presunção",
          "Menor complexidade que o Lucro Real",
          "Previsibilidade dos tributos",
          "Adequado para empresas com boa margem",
        ],
        disadvantages: [
          "Não considera despesas reais",
          "Pode ser mais caro para empresas com alta despesa",
          "Limitações de compensação",
          "Obrigações acessórias complexas",
        ],
        recommendation: inputs.profitMargin > presumptionRate * 100,
      };
    },
    []
  );

  const calculateReal = React.useCallback(
    (inputs: TaxCalculatorInputs): TaxCalculationResult => {
      const monthlyRevenue = inputs.monthlyRevenue;
      const realProfit = monthlyRevenue * (inputs.profitMargin / 100);

      // Cálculo dos impostos sobre o lucro real
      const irpj = realProfit * 0.15; // 15% sobre lucro real + adicional se > R$ 20.000/mês
      const additionalIrpj =
        realProfit > 20000 ? (realProfit - 20000) * 0.1 : 0;
      const csll = realProfit * 0.09; // 9% sobre lucro real

      // PIS e COFINS não-cumulativo
      const pis = monthlyRevenue * 0.0165; // 1.65% sobre receita bruta
      const cofins = monthlyRevenue * 0.076; // 7.6% sobre receita bruta

      // ISS ou ICMS dependendo do tipo
      let iss = 0;
      let icms = 0;
      if (
        inputs.companyType === "servicos" ||
        inputs.companyType === "tecnologia"
      ) {
        iss = monthlyRevenue * 0.05; // 5% ISS (média)
      } else {
        icms = monthlyRevenue * 0.18; // 18% ICMS (média)
      }

      const totalIrpj = irpj + additionalIrpj;
      const monthlyTax = totalIrpj + csll + pis + cofins + iss + icms;
      const annualTax = monthlyTax * 12;
      const effectiveRate = (monthlyTax / monthlyRevenue) * 100;

      return {
        regime: "real",
        monthlyTax,
        annualTax,
        effectiveRate,
        details: {
          irpj: totalIrpj,
          csll,
          pis,
          cofins,
          iss: iss || undefined,
          icms: icms || undefined,
        },
        advantages: [
          "Considera despesas reais",
          "Melhor para empresas com alta despesa",
          "Permite compensação de prejuízos",
          "Mais justo para alguns negócios",
        ],
        disadvantages: [
          "Maior complexidade contábil",
          "Mais obrigações acessórias",
          "Custos contábeis maiores",
          "Variabilidade dos tributos",
        ],
        recommendation: inputs.profitMargin < 20,
      };
    },
    []
  );

  return React.useMemo(
    () => ({
      calculateSimples,
      calculatePresumido,
      calculateReal,
    }),
    [calculateSimples, calculatePresumido, calculateReal]
  );
}

/**
 * Componente principal da calculadora tributária
 */
const TaxCalculator = React.forwardRef<HTMLDivElement, TaxCalculatorProps>(
  ({ className, onCalculationComplete }, ref) => {
    const { calculateSimples, calculatePresumido, calculateReal } =
      useTaxCalculations();

    // Estados do formulário
    const [inputs, setInputs] = React.useState<TaxCalculatorInputs>({
      monthlyRevenue: 0,
      employeeCount: 0,
      companyType: "servicos",
      currentRegime: "presumido",
      hasInventory: false,
      hasExportImport: false,
      profitMargin: 20,
    });

    const [results, setResults] = React.useState<TaxCalculationResult[]>([]);
    const [isCalculating, setIsCalculating] = React.useState(false);

    // Formatação de valores
    const formatCurrency = React.useCallback((value: number): string => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    }, []);

    const formatPercent = React.useCallback((value: number): string => {
      return `${value.toFixed(2)}%`;
    }, []);

    // Handlers
    const handleInputChange = React.useCallback(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (field: keyof TaxCalculatorInputs, value: any) => {
        setInputs((prev) => ({ ...prev, [field]: value }));
      },
      []
    );

    const handleCalculate = React.useCallback(() => {
      if (inputs.monthlyRevenue <= 0) {
        alert("Por favor, insira um faturamento mensal válido");
        return;
      }

      setIsCalculating(true);

      // Simular processamento
      setTimeout(() => {
        const calculations: TaxCalculationResult[] = [
          calculateSimples(inputs),
          calculatePresumido(inputs),
          calculateReal(inputs),
        ];

        setResults(calculations);
        onCalculationComplete?.(calculations);
        setIsCalculating(false);
      }, 1000);
    }, [
      inputs,
      calculateSimples,
      calculatePresumido,
      calculateReal,
      onCalculationComplete,
    ]);

    // Encontrar melhor opção
    const bestOption = React.useMemo(() => {
      if (results.length === 0) return null;
      return results.reduce((best, current) =>
        current.monthlyTax < best.monthlyTax ? current : best
      );
    }, [results]);

    return (
      <div
        ref={ref}
        className={cn("w-full max-w-4xl mx-auto space-y-6", className)}
      >
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary" />
              Calculadora de Regime Tributário
            </CardTitle>
            <p className="text-muted-foreground">
              Compare os regimes tributários e descubra qual é mais vantajoso
              para sua empresa
            </p>
          </CardHeader>
        </Card>

        {/* Formulário de inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyRevenue">Faturamento Mensal (R$)</Label>
                <Input
                  id="monthlyRevenue"
                  type="number"
                  placeholder="100000"
                  value={inputs.monthlyRevenue || ""}
                  onChange={(e) =>
                    handleInputChange("monthlyRevenue", Number(e.target.value))
                  }
                />
              </div>

              <div>
                <Label htmlFor="employeeCount">Número de Funcionários</Label>
                <Input
                  id="employeeCount"
                  type="number"
                  placeholder="10"
                  value={inputs.employeeCount || ""}
                  onChange={(e) =>
                    handleInputChange("employeeCount", Number(e.target.value))
                  }
                />
              </div>

              <div>
                <Label>Tipo de Empresa</Label>
                <Select
                  value={inputs.companyType}
                  onValueChange={(value) =>
                    handleInputChange("companyType", value as CompanyType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="industria">Indústria</SelectItem>
                    <SelectItem value="comercio">Comércio</SelectItem>
                    <SelectItem value="servicos">Serviços</SelectItem>
                    <SelectItem value="tecnologia">Tecnologia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Regime Atual</Label>
                <Select
                  value={inputs.currentRegime}
                  onValueChange={(value) =>
                    handleInputChange("currentRegime", value as TaxRegime)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simples">Simples Nacional</SelectItem>
                    <SelectItem value="presumido">Lucro Presumido</SelectItem>
                    <SelectItem value="real">Lucro Real</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="profitMargin">Margem de Lucro (%)</Label>
                <Input
                  id="profitMargin"
                  type="number"
                  placeholder="20"
                  value={inputs.profitMargin || ""}
                  onChange={(e) =>
                    handleInputChange("profitMargin", Number(e.target.value))
                  }
                />
              </div>
            </div>

            <Button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="w-full"
            >
              {isCalculating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Calculando...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calcular Tributos
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Comparação de Regimes</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results.map((result) => (
                <Card
                  key={result.regime}
                  className={cn(
                    "relative",
                    result === bestOption && "ring-2 ring-green-500"
                  )}
                >
                  {result === bestOption && (
                    <Badge className="absolute -top-2 left-4 bg-green-500">
                      Melhor Opção
                    </Badge>
                  )}

                  <CardHeader>
                    <CardTitle className="capitalize flex items-center justify-between">
                      {result.regime === "simples"
                        ? "Simples Nacional"
                        : result.regime === "presumido"
                        ? "Lucro Presumido"
                        : "Lucro Real"}
                      {result.recommendation && (
                        <Badge variant="outline" className="text-xs">
                          Recomendado
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Imposto Mensal
                        </span>
                        <span className="font-bold text-lg">
                          {formatCurrency(result.monthlyTax)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Taxa Efetiva
                        </span>
                        <span className="font-semibold">
                          {formatPercent(result.effectiveRate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Imposto Anual
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(result.annualTax)}
                        </span>
                      </div>
                    </div>

                    {/* Comparação com regime atual */}
                    {inputs.currentRegime !== result.regime && (
                      <div className="pt-2 border-t">
                        {(() => {
                          const currentResult = results.find(
                            (r) => r.regime === inputs.currentRegime
                          );
                          if (!currentResult) return null;

                          const difference =
                            result.monthlyTax - currentResult.monthlyTax;
                          const isEconomy = difference < 0;

                          return (
                            <div
                              className={cn(
                                "flex items-center gap-2 text-sm",
                                isEconomy ? "text-green-600" : "text-red-600"
                              )}
                            >
                              {isEconomy ? (
                                <TrendingDown className="w-4 h-4" />
                              ) : (
                                <TrendingUp className="w-4 h-4" />
                              )}
                              <span>
                                {isEconomy ? "Economia de " : "Aumento de "}
                                {formatCurrency(Math.abs(difference))} vs. atual
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Detalhes dos impostos */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Composição:</h4>
                      <div className="space-y-1 text-xs">
                        {Object.entries(result.details).map(([tax, value]) => {
                          if (!value) return null;
                          return (
                            <div key={tax} className="flex justify-between">
                              <span className="capitalize">
                                {tax.toUpperCase()}:
                              </span>
                              <span>{formatCurrency(value)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Resumo da economia */}
            {bestOption && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">
                      Resumo da Economia
                    </h4>
                  </div>

                  {(() => {
                    const currentResult = results.find(
                      (r) => r.regime === inputs.currentRegime
                    );
                    if (
                      !currentResult ||
                      bestOption.regime === inputs.currentRegime
                    ) {
                      return (
                        <p className="text-green-700">
                          Seu regime atual já é o mais vantajoso!
                        </p>
                      );
                    }

                    const monthlyEconomy =
                      currentResult.monthlyTax - bestOption.monthlyTax;
                    const annualEconomy = monthlyEconomy * 12;

                    return (
                      <div className="text-green-700">
                        <p>
                          Mudando para{" "}
                          <strong>
                            {bestOption.regime === "simples"
                              ? "Simples Nacional"
                              : bestOption.regime === "presumido"
                              ? "Lucro Presumido"
                              : "Lucro Real"}
                          </strong>
                          , você pode economizar:
                        </p>
                        <div className="mt-2 space-y-1">
                          <div>
                            <strong>Mensal:</strong>{" "}
                            {formatCurrency(monthlyEconomy)}
                          </div>
                          <div>
                            <strong>Anual:</strong>{" "}
                            {formatCurrency(annualEconomy)}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  }
);

TaxCalculator.displayName = "TaxCalculator";

export { TaxCalculator, type TaxCalculatorProps, type TaxCalculationResult };
