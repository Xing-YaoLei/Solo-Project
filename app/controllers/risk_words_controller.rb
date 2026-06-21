class RiskWordsController < ApplicationController
  before_action :set_risk_word, only: %i[show edit update destroy]

  def index
    @q = RiskWord.ransack(params[:q])
    @pagy, @risk_words = pagy(@q.result.order(created_at: :desc))
  end

  def show; end

  def new
    @risk_word = RiskWord.new
  end

  def edit; end

  def create
    @risk_word = RiskWord.new(risk_word_params)

    if @risk_word.save
      redirect_to @risk_word, notice: '风险词创建成功'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @risk_word.update(risk_word_params)
      redirect_to @risk_word, notice: '风险词更新成功'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @risk_word.destroy
    redirect_to risk_words_url, notice: '风险词已删除'
  end

  private

  def set_risk_word
    @risk_word = RiskWord.find(params[:id])
  end

  def risk_word_params
    params.require(:risk_word).permit(:word, :category, :risk_level, :description)
  end
end
