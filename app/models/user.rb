class User < ApplicationRecord
  has_secure_password

  enum :role, { student: 0, assistant: 1, teacher: 2, finance: 3, admin: 4 }
  enum :status, { active: 0, inactive: 1, banned: 2 }

  has_many :enrollments, foreign_key: :user_id
  has_many :courses, through: :enrollments
  has_many :orders, foreign_key: :user_id
  has_many :exam_records, foreign_key: :user_id
  has_many :appeals, foreign_key: :user_id
  has_many :qa_threads, foreign_key: :user_id
  has_many :qa_replies, foreign_key: :user_id
  has_many :certificate_issuances, foreign_key: :user_id
  has_many :follow_ups, foreign_key: :assistant_id
  has_many :taught_courses, class_name: "Course", foreign_key: :teacher_id
  has_many :handled_appeals, class_name: "Appeal", foreign_key: :handled_by_id
  has_many :approved_makeup_exams, class_name: "MakeupExam", foreign_key: :approved_by_id
  has_many :approved_extensions, class_name: "Extension", foreign_key: :approved_by_id

  validates :email, presence: true, uniqueness: true
  validates :name, presence: true
  validates :role, presence: true

  def student?
    role == "student"
  end

  def assistant?
    role == "assistant" || admin?
  end

  def teacher?
    role == "teacher" || admin?
  end

  def finance?
    role == "finance" || admin?
  end

  def admin?
    role == "admin"
  end
end
