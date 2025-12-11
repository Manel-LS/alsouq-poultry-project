
namespace MySql.Data.MySqlClient
{
    [Serializable]
    internal class MySqlConversionException : Exception
    {
        public MySqlConversionException()
        {
        }

        public MySqlConversionException(string? message) : base(message)
        {
        }

        public MySqlConversionException(string? message, Exception? innerException) : base(message, innerException)
        {
        }
    }
}